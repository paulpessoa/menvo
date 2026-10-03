create table public.inactive_accounts_queue (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  last_sign_in_at timestamptz not null,
  notice_30d_sent_at timestamptz,
  scheduled_deletion_at timestamptz,
  created_at timestamptz not null default now(),
  constraint inactive_schedule_set check (
    (notice_30d_sent_at is null) = (scheduled_deletion_at is null)
  )
);

comment on table public.inactive_accounts_queue is
  'Fila de exclusão de contas inativas (qualquer usuário sem login há mais de 1 ano).';

alter table public.inactive_accounts_queue enable row level security;

create policy "Admins can read inactive accounts queue"
  on public.inactive_accounts_queue for select
  using (public.is_admin());

-- Add source 'inactivity_policy' to data_deletion_log
alter table public.data_deletion_log drop constraint data_deletion_log_source_check;
alter table public.data_deletion_log add constraint data_deletion_log_source_check
  check (source in ('invite_token', 'self_service', 'admin', 'retention_policy', 'inactivity_policy'));

-- Create a view to safely expose inactive users to the service role
create or replace view public.vw_inactive_users with (security_invoker = on) as
select id, coalesce(last_sign_in_at, created_at) as last_activity_at
from auth.users
where coalesce(last_sign_in_at, created_at) < now() - interval '1 year';

grant select on public.vw_inactive_users to service_role;
