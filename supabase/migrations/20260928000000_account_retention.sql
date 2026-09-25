-- Automatic retention/deletion queue for imported (JotForm) accounts that
-- were invited to reengage but never activated (never signed in).
-- See docs/domains/account-retention.md for the full design.

create table public.account_retention (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  policy text not null default 'imported_never_activated'
    check (policy in ('imported_never_activated')),
  campaign text not null,
  clock_started_at timestamptz not null,
  notice_30d_sent_at timestamptz,
  scheduled_deletion_at timestamptz,
  notice_1d_sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint retention_notice_order check (
    notice_1d_sent_at is null or notice_30d_sent_at is not null
  ),
  constraint retention_schedule_set check (
    (notice_30d_sent_at is null) = (scheduled_deletion_at is null)
  )
);

comment on table public.account_retention is
  'Queue for automatic deletion of imported (JotForm) accounts that were reengagement-invited but never signed in. See docs/domains/account-retention.md.';

alter table public.account_retention enable row level security;

create policy "Admins can read account retention"
  on public.account_retention for select
  using (public.is_admin());

-- No write policy for anon/authenticated: only the retention cron writes,
-- via the service-role client (same deliberate exception as ADR 0005).

-- New deletion source for accounts removed by the retention cron.
alter table public.data_deletion_log drop constraint data_deletion_log_source_check;
alter table public.data_deletion_log add constraint data_deletion_log_source_check
  check (source in ('invite_token', 'self_service', 'admin', 'retention_policy'));
