-- Migration: Diagnostic Shares & Strict Mentor RLS
-- Plan: docs/AI_PLATFORM_PLAN.md §8 (Fase 2 item 5b) & §12.2
--
-- 1. Creates `diagnostic_shares` table with mentee_id, mentor_id, scope, created_at, revoked_at.
-- 2. Sets strict RLS: mentee controls creating and revoking shares; mentor reads only while active.
-- 3. Grants SELECT to mentors on quiz_responses and diagnostic_sessions when an active share exists.

create table if not exists public.diagnostic_shares (
  id uuid primary key default gen_random_uuid(),
  diagnostic_session_id uuid references public.diagnostic_sessions(id) on delete cascade,
  quiz_response_id uuid references public.quiz_responses(id) on delete cascade,
  mentee_id uuid not null references auth.users(id) on delete cascade,
  mentor_id uuid not null references auth.users(id) on delete cascade,
  scope text not null check (scope in ('summary', 'full')) default 'summary',
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint chk_diagnostic_target check (
    diagnostic_session_id is not null or quiz_response_id is not null
  )
);

alter table public.diagnostic_shares enable row level security;

-- Indexes for performance
create index if not exists idx_diagnostic_shares_mentee
  on public.diagnostic_shares (mentee_id, created_at desc);

create index if not exists idx_diagnostic_shares_mentor_active
  on public.diagnostic_shares (mentor_id)
  where revoked_at is null;

create index if not exists idx_diagnostic_shares_quiz_response
  on public.diagnostic_shares (quiz_response_id);

create index if not exists idx_diagnostic_shares_diagnostic_session
  on public.diagnostic_shares (diagnostic_session_id);

-- Unique index to prevent duplicate active shares for the same target + mentor
create unique index if not exists idx_diagnostic_shares_active_unique_quiz
  on public.diagnostic_shares (quiz_response_id, mentor_id)
  where quiz_response_id is not null and revoked_at is null;

create unique index if not exists idx_diagnostic_shares_active_unique_session
  on public.diagnostic_shares (diagnostic_session_id, mentor_id)
  where diagnostic_session_id is not null and revoked_at is null;

-- RLS Policies on diagnostic_shares
-- 1. Mentee can view all their shares; Mentor can view active shares with them; Admin can view all
create policy "Users read authorized diagnostic shares"
  on public.diagnostic_shares for select to authenticated
  using (
    mentee_id = auth.uid()
    or (mentor_id = auth.uid() and revoked_at is null)
    or public.is_admin()
  );

-- 2. Mentee can insert new shares of their own diagnostics
create policy "Mentees insert own diagnostic shares"
  on public.diagnostic_shares for insert to authenticated
  with check (
    mentee_id = auth.uid()
  );

-- 3. Mentee can update (revoke) their own shares
create policy "Mentees update own diagnostic shares"
  on public.diagnostic_shares for update to authenticated
  using (
    mentee_id = auth.uid() or public.is_admin()
  )
  with check (
    mentee_id = auth.uid() or public.is_admin()
  );

-- 4. Mentee can delete their own shares
create policy "Mentees delete own diagnostic shares"
  on public.diagnostic_shares for delete to authenticated
  using (
    mentee_id = auth.uid() or public.is_admin()
  );

revoke all on public.diagnostic_shares from anon;
grant select, insert, update, delete on public.diagnostic_shares to authenticated;

-- RLS Policies on quiz_responses for mentors with active shares
drop policy if exists "Mentors read shared quiz responses" on public.quiz_responses;
create policy "Mentors read shared quiz responses"
  on public.quiz_responses for select to authenticated
  using (
    exists (
      select 1 from public.diagnostic_shares s
      where (s.quiz_response_id = quiz_responses.id or s.diagnostic_session_id = quiz_responses.diagnostic_session_id)
        and s.mentor_id = auth.uid()
        and s.revoked_at is null
    )
  );

-- RLS Policies on diagnostic_sessions for mentors with active shares
drop policy if exists "Mentors read shared diagnostic sessions" on public.diagnostic_sessions;
create policy "Mentors read shared diagnostic sessions"
  on public.diagnostic_sessions for select to authenticated
  using (
    exists (
      select 1 from public.diagnostic_shares s
      where s.diagnostic_session_id = diagnostic_sessions.id
        and s.mentor_id = auth.uid()
        and s.revoked_at is null
    )
  );
