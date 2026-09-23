-- AI usage metering + monthly quota (AI_PLATFORM_PLAN.md §5, Fase 0).
--
-- Why in Postgres and not in memory: on Vercel each serverless instance has its
-- own memory, so an in-memory limit is not a limit. Every AI call must
-- (1) pass the quota gate `consume_ai_quota` and (2) leave a row in
-- `ai_usage_events` via `record_ai_usage`. Both are SECURITY DEFINER RPCs that
-- read `auth.uid()` themselves: authenticated users have no insert/update policy
-- on these tables, so they can at most consume their own quota — never refund
-- it or touch someone else's. No service_role involved.

-- /api/ai/match has always inserted `matched_count`, but the column never
-- existed, so PostgREST rejected every insert and no demand was ever logged.
alter table public.ai_missing_demands add column if not exists matched_count int;

-- ─── Pricing (USD per 1M tokens). Changing a price = new row, never an update,
-- so historical costs stay reproducible. ────────────────────────────────────
create table if not exists public.ai_model_pricing (
  provider text not null,
  model text not null,
  input_per_mtok numeric(12, 6) not null check (input_per_mtok >= 0),
  output_per_mtok numeric(12, 6) not null check (output_per_mtok >= 0),
  cached_input_per_mtok numeric(12, 6) check (cached_input_per_mtok >= 0),
  effective_from timestamptz not null default now(),
  notes text,
  primary key (provider, model, effective_from)
);

-- ─── Entitlements: monthly limit per role × feature. NULL limit = unlimited.
-- The user's limit is the most generous across their roles plus 'default'.
-- No row for a feature = feature disabled (limit 0). ──────────────────────
create table if not exists public.ai_entitlements (
  role text not null,
  feature text not null check (feature ~ '^[a-z_]{2,40}$'),
  monthly_limit int check (monthly_limit is null or monthly_limit >= 0),
  updated_at timestamptz not null default now(),
  primary key (role, feature)
);

-- ─── Ledger: one row per user × feature × month (America/Sao_Paulo). ─────────
create table if not exists public.ai_quota_ledger (
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null,
  period_start date not null,
  used_count int not null default 0 check (used_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, feature, period_start)
);

-- ─── Usage events: one row per model call (including failed attempts and the
-- deterministic fallback), so cost, error rate and fallback rate are all
-- measurable. Stores no prompt/response content. ───────────────────────────
create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  roles text[] not null default '{}',
  feature text not null check (feature ~ '^[a-z_]{2,40}$'),
  run_id uuid,
  provider text not null,
  model text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cached_input_tokens int not null default 0,
  latency_ms int,
  cost_usd numeric(14, 8),
  status text not null check (status in ('ok', 'error', 'fallback')),
  error_code text
);

create index if not exists idx_ai_usage_events_created_at on public.ai_usage_events (created_at);
create index if not exists idx_ai_usage_events_user_created on public.ai_usage_events (user_id, created_at);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
alter table public.ai_model_pricing enable row level security;
alter table public.ai_entitlements enable row level security;
alter table public.ai_quota_ledger enable row level security;
alter table public.ai_usage_events enable row level security;

create policy "Pricing is readable by authenticated users"
  on public.ai_model_pricing for select to authenticated using (true);
create policy "Admins manage pricing"
  on public.ai_model_pricing for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Entitlements are readable by authenticated users"
  on public.ai_entitlements for select to authenticated using (true);
create policy "Admins manage entitlements"
  on public.ai_entitlements for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Users read own quota, admins read all"
  on public.ai_quota_ledger for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "Users read own usage, admins read all"
  on public.ai_usage_events for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ─── Helpers ──────────────────────────────────────────────────────────────────
create or replace function public.ai_current_period()
returns date
language sql stable
set search_path = public
as $$
  select date_trunc('month', now() at time zone 'America/Sao_Paulo')::date;
$$;

create or replace function public.ai_user_roles(p_user_id uuid)
returns text[]
language sql stable security definer
set search_path = public
as $$
  select coalesce(array_agg(r.name order by r.name), '{}')
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  where ur.user_id = p_user_id;
$$;

create or replace function public.ai_monthly_limit(p_user_id uuid, p_feature text)
returns table (monthly_limit int, unlimited boolean)
language sql stable security definer
set search_path = public
as $$
  select
    coalesce(max(e.monthly_limit), 0)::int,
    coalesce(bool_or(e.monthly_limit is null), false)
  from public.ai_entitlements e
  where e.feature = p_feature
    and (e.role = 'default' or e.role = any (public.ai_user_roles(p_user_id)));
$$;

-- ─── Global monthly budget (AI_PLATFORM_PLAN.md §9 D3): the hard ceiling on
-- what the platform spends, whatever the per-user credits say. The row with
-- the latest `month` <= current month applies, so one row carries forward
-- until the admin inserts a new one. No row = no global cap. ───────────────
create table if not exists public.ai_budget (
  month date primary key check (extract(day from month) = 1),
  limit_usd numeric(10, 2) not null check (limit_usd >= 0),
  updated_at timestamptz not null default now()
);

alter table public.ai_budget enable row level security;

create policy "Admins manage the AI budget"
  on public.ai_budget for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.ai_budget_exhausted()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    (
      select sum(e.cost_usd)
      from public.ai_usage_events e
      where e.created_at >= (public.ai_current_period()::timestamp at time zone 'America/Sao_Paulo')
    ) >= (
      select b.limit_usd
      from public.ai_budget b
      where b.month <= public.ai_current_period()
      order by b.month desc
      limit 1
    ),
    false
  );
$$;

-- Internal helpers take an arbitrary user id (or expose platform spend), so
-- they must not be callable directly.
revoke execute on function public.ai_user_roles(uuid) from public, anon, authenticated;
revoke execute on function public.ai_monthly_limit(uuid, text) from public, anon, authenticated;
revoke execute on function public.ai_budget_exhausted() from public, anon, authenticated;

-- ─── consume_ai_quota: atomic check-and-increment for the caller ─────────────
-- `reason`: 'ok' | 'quota' (user's monthly credits used up) | 'budget'
-- (platform's monthly budget reached). Unlimited users (admins) bypass both.
create or replace function public.consume_ai_quota(p_feature text)
returns table (allowed boolean, used int, quota_limit int, resets_at timestamptz, reason text)
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_period date := public.ai_current_period();
  v_resets timestamptz := ((public.ai_current_period() + interval '1 month')::timestamp at time zone 'America/Sao_Paulo');
  v_limit int;
  v_unlimited boolean;
  v_used int;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select l.monthly_limit, l.unlimited into v_limit, v_unlimited
  from public.ai_monthly_limit(v_uid, p_feature) l;

  if v_unlimited then
    insert into public.ai_quota_ledger as q (user_id, feature, period_start, used_count)
    values (v_uid, p_feature, v_period, 1)
    on conflict (user_id, feature, period_start)
      do update set used_count = q.used_count + 1, updated_at = now()
    returning q.used_count into v_used;
    return query select true, v_used, null::int, v_resets, 'ok'::text;
    return;
  end if;

  if not public.ai_budget_exhausted() and v_limit > 0 then
    -- The WHERE on the conflict branch is what makes this race-free: two
    -- concurrent tabs cannot both take the last credit.
    insert into public.ai_quota_ledger as q (user_id, feature, period_start, used_count)
    values (v_uid, p_feature, v_period, 1)
    on conflict (user_id, feature, period_start)
      do update set used_count = q.used_count + 1, updated_at = now()
      where q.used_count < v_limit
    returning q.used_count into v_used;

    if v_used is not null then
      return query select true, v_used, v_limit, v_resets, 'ok'::text;
      return;
    end if;
  end if;

  select q.used_count into v_used
  from public.ai_quota_ledger q
  where q.user_id = v_uid and q.feature = p_feature and q.period_start = v_period;

  return query select
    false,
    coalesce(v_used, 0),
    v_limit,
    v_resets,
    case when coalesce(v_used, 0) < v_limit then 'budget' else 'quota' end;
end;
$$;

-- ─── get_ai_quota: read-only status for the UI ("7 de 10 buscas") ───────────
create or replace function public.get_ai_quota(p_feature text)
returns table (allowed boolean, used int, quota_limit int, resets_at timestamptz, reason text)
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_limit int;
  v_unlimited boolean;
  v_used int;
  v_reason text;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select l.monthly_limit, l.unlimited into v_limit, v_unlimited
  from public.ai_monthly_limit(v_uid, p_feature) l;

  select coalesce(max(q.used_count), 0) into v_used
  from public.ai_quota_ledger q
  where q.user_id = v_uid and q.feature = p_feature and q.period_start = public.ai_current_period();

  v_reason := case
    when v_unlimited then 'ok'
    when v_used >= v_limit then 'quota'
    when public.ai_budget_exhausted() then 'budget'
    else 'ok'
  end;

  return query select
    v_reason = 'ok',
    v_used,
    case when v_unlimited then null else v_limit end,
    ((public.ai_current_period() + interval '1 month')::timestamp at time zone 'America/Sao_Paulo'),
    v_reason;
end;
$$;

-- ─── record_ai_usage: one event per model call, cost computed from pricing ──
create or replace function public.record_ai_usage(
  p_feature text,
  p_provider text,
  p_model text,
  p_input_tokens int default 0,
  p_output_tokens int default 0,
  p_cached_input_tokens int default 0,
  p_latency_ms int default null,
  p_status text default 'ok',
  p_error_code text default null,
  p_run_id uuid default null
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_in int := least(greatest(coalesce(p_input_tokens, 0), 0), 10000000);
  v_out int := least(greatest(coalesce(p_output_tokens, 0), 0), 10000000);
  v_cached int := least(greatest(coalesce(p_cached_input_tokens, 0), 0), v_in);
  v_price public.ai_model_pricing%rowtype;
  v_cost numeric(14, 8);
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select * into v_price
  from public.ai_model_pricing p
  where p.provider = p_provider and p.model = p_model and p.effective_from <= now()
  order by p.effective_from desc
  limit 1;

  -- Unknown model → cost stays NULL (visible in the admin report as
  -- "sem preço") instead of silently counting as free.
  if found then
    v_cost := (
      (v_in - v_cached) * v_price.input_per_mtok
      + v_cached * coalesce(v_price.cached_input_per_mtok, v_price.input_per_mtok)
      + v_out * v_price.output_per_mtok
    ) / 1000000.0;
  end if;

  insert into public.ai_usage_events (
    user_id, roles, feature, run_id, provider, model,
    input_tokens, output_tokens, cached_input_tokens,
    latency_ms, cost_usd, status, error_code
  ) values (
    v_uid, public.ai_user_roles(v_uid), p_feature, p_run_id, left(p_provider, 40), left(p_model, 80),
    v_in, v_out, v_cached,
    greatest(p_latency_ms, 0), v_cost, p_status, left(p_error_code, 120)
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.consume_ai_quota(text) from public, anon;
revoke execute on function public.get_ai_quota(text) from public, anon;
revoke execute on function public.record_ai_usage(text, text, text, int, int, int, int, text, text, uuid) from public, anon;
grant execute on function public.consume_ai_quota(text) to authenticated;
grant execute on function public.get_ai_quota(text) to authenticated;
grant execute on function public.record_ai_usage(text, text, text, int, int, int, int, text, text, uuid) to authenticated;

-- ─── Reporting views (security_invoker: RLS of the caller applies, so only
-- admins see everyone; PostgREST aggregates are disabled on this project). ──
create or replace view public.ai_usage_monthly
with (security_invoker = true) as
select
  date_trunc('month', e.created_at at time zone 'America/Sao_Paulo')::date as month,
  e.feature,
  e.provider,
  e.model,
  count(*)::int as calls,
  count(*) filter (where e.status = 'error')::int as errors,
  count(*) filter (where e.status = 'fallback')::int as fallbacks,
  count(distinct e.user_id)::int as users,
  coalesce(sum(e.input_tokens), 0)::bigint as input_tokens,
  coalesce(sum(e.output_tokens), 0)::bigint as output_tokens,
  coalesce(sum(e.cost_usd), 0)::numeric(14, 6) as cost_usd,
  count(*) filter (where e.cost_usd is null and e.status <> 'fallback')::int as unpriced_calls,
  (percentile_cont(0.5) within group (order by e.latency_ms))::int as p50_latency_ms
from public.ai_usage_events e
group by 1, 2, 3, 4;

create or replace view public.ai_usage_by_user_monthly
with (security_invoker = true) as
select
  date_trunc('month', e.created_at at time zone 'America/Sao_Paulo')::date as month,
  e.user_id,
  p.full_name,
  count(*)::int as calls,
  coalesce(sum(e.cost_usd), 0)::numeric(14, 6) as cost_usd
from public.ai_usage_events e
left join public.profiles p on p.id = e.user_id
group by 1, 2, 3;

-- ─── Seeds ────────────────────────────────────────────────────────────────────
-- Prices checked 2026-09-23 (AI_PLATFORM_PLAN.md §11).
insert into public.ai_model_pricing (provider, model, input_per_mtok, output_per_mtok, cached_input_per_mtok, effective_from, notes) values
  ('openai', 'gpt-4o-mini',            0.15,  0.60, 0.075,  '2026-01-01', 'OpenAI list price'),
  ('groq',   'openai/gpt-oss-20b',     0.075, 0.30, 0.0375, '2026-01-01', 'Groq list price'),
  ('groq',   'qwen/qwen3.8-27b',       0.80,  4.00, null,   '2026-01-01', 'Groq list price; slated for retirement (plan §11.2)'),
  ('google', 'gemini-3.5-flash-lite',  0.30,  2.50, 0.03,   '2026-01-01', 'Gemini API paid tier'),
  ('local',  'keyword',                0,     0,    0,      '2026-01-01', 'Deterministic fallback, no LLM')
on conflict do nothing;

-- Global ceiling: US$ 10/month (founder decision D3), carried forward monthly.
insert into public.ai_budget (month, limit_usd) values ('2026-09-01', 10.00)
on conflict do nothing;

-- Initial limits (founder can change any row from SQL/admin without a deploy).
insert into public.ai_entitlements (role, feature, monthly_limit) values
  ('default',   'match',                5),
  ('mentee',    'match',                10),
  ('mentor',    'match',                10),
  ('admin',     'match',                null),
  ('default',   'assistant',            30),
  ('mentee',    'assistant',            60),
  ('admin',     'assistant',            null),
  ('admin',     'admin_waitlist_match', null)
on conflict do nothing;
