-- Reengagement invite campaigns (JotForm/Estágio Recife base) + LGPD
-- self-service data deletion via token, no login required.
-- See docs/domains/reengagement-invites.md for the full design.

-- ---------------------------------------------------------------------
-- 0. Pre-flight: two pre-existing FKs to auth.users use ON DELETE NO
--    ACTION instead of CASCADE/SET NULL, which would block
--    `auth.admin.deleteUser()` whenever the target user had cancelled an
--    appointment or reported a missing-demand entry. Both columns are
--    nullable audit references ("who did this"), so SET NULL is safe and
--    keeps the row (and the rest of the audit trail) intact.
-- ---------------------------------------------------------------------

alter table public.appointments
  drop constraint appointments_cancelled_by_fkey,
  add constraint appointments_cancelled_by_fkey
    foreign key (cancelled_by) references auth.users(id) on delete set null;

alter table public.ai_missing_demands
  drop constraint ai_missing_demands_user_id_fkey,
  add constraint ai_missing_demands_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete set null;

-- ---------------------------------------------------------------------
-- 1. reengagement_invites — one row per (user, campaign) sent
-- ---------------------------------------------------------------------

create table public.reengagement_invites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  campaign text not null,
  token_hash text not null unique,
  subject text not null,
  sent_by uuid references public.profiles(id) on delete set null,
  sent_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '60 days'),
  opened_at timestamptz,
  response text check (response in ('accepted', 'accepted_mentor', 'opted_out', 'deleted')),
  responded_at timestamptz,
  unique (user_id, campaign)
);

comment on table public.reengagement_invites is
  'Bulk reengagement campaigns sent to the imported JotForm/Estágio Recife base (or any admin-selected audience). token_hash is sha256(token) — the plaintext token only ever exists inside the sent e-mail.';

create index reengagement_invites_campaign_idx on public.reengagement_invites (campaign);

alter table public.reengagement_invites enable row level security;

create policy "Admins can read reengagement invites"
  on public.reengagement_invites for select
  using (public.is_admin());

-- No insert/update/delete policy for anon/authenticated: writes only
-- happen through the service-role client in
-- lib/services/invites/invite-token.service.ts, guarded by requireAdmin()
-- (send) or by a valid token (respond) — never by a user's own RLS-scoped
-- session.

-- ---------------------------------------------------------------------
-- 2. data_deletion_log — proof that an LGPD deletion request was
--    fulfilled, without retaining the personal data itself.
-- ---------------------------------------------------------------------

create table public.data_deletion_log (
  id uuid primary key default gen_random_uuid(),
  email_hash text not null,
  source text not null check (source in ('invite_token', 'self_service', 'admin')),
  campaign text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

comment on table public.data_deletion_log is
  'LGPD art. 18 deletion audit trail. email_hash = sha256(lower(trim(email))); never the plaintext e-mail, so this table has no personal data of its own.';

alter table public.data_deletion_log enable row level security;

create policy "Admins can read the deletion log"
  on public.data_deletion_log for select
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- 3. email_suppressions — do-not-contact list, keyed by hash
-- ---------------------------------------------------------------------

create table public.email_suppressions (
  email_hash text primary key,
  reason text not null check (reason in ('deleted', 'opted_out')),
  created_at timestamptz not null default now()
);

comment on table public.email_suppressions is
  'Do-not-contact list keyed by sha256(lower(trim(email))). Checked before any reengagement send and before re-importing a deleted/opted-out person from a future JotForm batch.';

alter table public.email_suppressions enable row level security;

create policy "Admins can read email suppressions"
  on public.email_suppressions for select
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- 4. profiles.email_opt_out_at — relationship e-mails must check this
--    before sending (transactional e-mails like scheduling/password are
--    unaffected).
-- ---------------------------------------------------------------------

alter table public.profiles add column if not exists email_opt_out_at timestamptz;
