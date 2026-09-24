-- Migration: AI Diagnostic Sessions, Threads, Messages & Quiz User Link
-- Plan: docs/AI_PLATFORM_PLAN.md §8 (Fase 1: Diagnóstico Agêntico)
--
-- 1. Creates `diagnostic_sessions` to store state machine slots, step progression,
--    and expiration (7-day rolling window) with RLS.
-- 2. Creates `ai_threads` and `ai_messages` for structured chat history.
-- 3. Adds `user_id` and `diagnostic_session_id` to `quiz_responses` with updated RLS.
-- 4. Adds `ai_disclosure_accepted_at` to `profiles` for onboarding consent.
-- 5. Seeds `ai_entitlements` with the monthly `diagnostic` limit (1/month).

-- ─── 1. diagnostic_sessions ──────────────────────────────────────────────────
create table if not exists public.diagnostic_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('in_progress', 'completed', 'abandoned')) default 'in_progress',
  current_step integer not null default 1,
  state jsonb not null default '{}'::jsonb,
  quiz_response_id uuid references public.quiz_responses(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.diagnostic_sessions enable row level security;

create index if not exists idx_diagnostic_sessions_user_status
  on public.diagnostic_sessions (user_id, status);

create index if not exists idx_diagnostic_sessions_expires_at
  on public.diagnostic_sessions (expires_at)
  where status = 'in_progress';

create policy "Users read own diagnostic sessions"
  on public.diagnostic_sessions for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "Users insert own diagnostic sessions"
  on public.diagnostic_sessions for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users update own diagnostic sessions"
  on public.diagnostic_sessions for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "Users delete own diagnostic sessions"
  on public.diagnostic_sessions for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

revoke all on public.diagnostic_sessions from anon;
grant select, insert, update, delete on public.diagnostic_sessions to authenticated;


-- ─── 2. ai_threads ───────────────────────────────────────────────────────────
create table if not exists public.ai_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('assistant', 'diagnostic', 'feedback')) default 'assistant',
  title text,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_threads enable row level security;

create index if not exists idx_ai_threads_user_mode
  on public.ai_threads (user_id, mode);

create index if not exists idx_ai_threads_user_updated
  on public.ai_threads (user_id, updated_at desc);

create policy "Users read own ai threads"
  on public.ai_threads for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "Users insert own ai threads"
  on public.ai_threads for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users update own ai threads"
  on public.ai_threads for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "Users delete own ai threads"
  on public.ai_threads for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

revoke all on public.ai_threads from anon;
grant select, insert, update, delete on public.ai_threads to authenticated;


-- ─── 3. ai_messages ──────────────────────────────────────────────────────────
create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.ai_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  artifact jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.ai_messages enable row level security;

create index if not exists idx_ai_messages_thread_created
  on public.ai_messages (thread_id, created_at asc);

create index if not exists idx_ai_messages_user_created
  on public.ai_messages (user_id, created_at desc);

create policy "Users read own ai messages"
  on public.ai_messages for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "Users insert own ai messages"
  on public.ai_messages for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users update own ai messages"
  on public.ai_messages for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "Users delete own ai messages"
  on public.ai_messages for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

revoke all on public.ai_messages from anon;
grant select, insert, update, delete on public.ai_messages to authenticated;


-- ─── 4. quiz_responses additions ─────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quiz_responses' and column_name = 'user_id'
  ) then
    alter table public.quiz_responses add column user_id uuid references auth.users(id) on delete cascade;
    create index if not exists idx_quiz_responses_user_id on public.quiz_responses (user_id);
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quiz_responses' and column_name = 'diagnostic_session_id'
  ) then
    alter table public.quiz_responses add column diagnostic_session_id uuid references public.diagnostic_sessions(id) on delete set null;
  end if;
end $$;

-- Update RLS for quiz_responses SELECT so authenticated users can read their own by user_id or email
drop policy if exists "Users read own quiz responses" on public.quiz_responses;
create policy "Users read own quiz responses"
  on public.quiz_responses for select to authenticated
  using (
    user_id = auth.uid()
    or email = lower(auth.jwt() ->> 'email')
    or public.is_admin()
  );

-- Update RLS for quiz_responses INSERT so authenticated users can attach their user_id
drop policy if exists "Public can submit quiz responses" on public.quiz_responses;
create policy "Public can submit quiz responses"
  on public.quiz_responses for insert to anon, authenticated
  with check (
    ai_analysis is null and processed_at is null and score is null
    and coalesce(email_sent, false) = false and email_sent_at is null
    and (user_id is null or user_id = auth.uid())
  );


-- ─── 5. profiles: AI disclosure consent ──────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'ai_disclosure_accepted_at'
  ) then
    alter table public.profiles add column ai_disclosure_accepted_at timestamptz;
  end if;
end $$;


-- ─── 6. ai_entitlements: seed diagnostic feature (1 per month) ───────────────
insert into public.ai_entitlements (role, feature, monthly_limit) values
  ('default', 'diagnostic', 1),
  ('mentee',  'diagnostic', 1),
  ('mentor',  'diagnostic', 1),
  ('admin',   'diagnostic', null)
on conflict (role, feature) do update
  set monthly_limit = excluded.monthly_limit;
