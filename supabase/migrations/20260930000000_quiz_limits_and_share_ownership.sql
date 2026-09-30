-- Quiz analysis limit + diagnostic share ownership (2026-09-30).
--
-- 1. diagnostic_shares: the insert/update policies only checked
--    `mentee_id = auth.uid()`, never that the shared quiz/diagnostic belongs
--    to the caller. The quiz id is in the public results URL (shared on
--    LinkedIn/WhatsApp by design), so any logged-in person could "share"
--    someone else's quiz with a second account of theirs and read the whole
--    row through "Mentors read shared quiz responses" (e-mail, personal-life
--    answer, ...). Now the target must be the caller's own.
--
-- 2. quiz_responses: each /quiz submission triggers one paid AI analysis.
--    Until now the only limits were an in-memory per-IP counter (per
--    serverless instance, so not a real limit) and the global monthly budget.
--    Now: at most 3 analyses per e-mail every 30 days, enforced in the insert
--    policy (the API can be bypassed with the public anon key) and exposed to
--    the API through `quiz_submission_status` so it can answer with a clear
--    message instead of a generic RLS error.

-- ─── 1. Ownership helpers (SECURITY DEFINER: quiz_responses' own RLS reads
--        diagnostic_shares, so querying it from a diagnostic_shares policy
--        directly would recurse). ─────────────────────────────────────────────
create or replace function public.owns_quiz_response(p_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.quiz_responses q
    where q.id = p_id
      and (q.user_id = auth.uid() or q.email = lower(auth.jwt() ->> 'email'))
  );
$$;

create or replace function public.owns_diagnostic_session(p_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.diagnostic_sessions d
    where d.id = p_id and d.user_id = auth.uid()
  );
$$;

revoke all on function public.owns_quiz_response(uuid) from public, anon;
revoke all on function public.owns_diagnostic_session(uuid) from public, anon;
grant execute on function public.owns_quiz_response(uuid) to authenticated;
grant execute on function public.owns_diagnostic_session(uuid) to authenticated;

drop policy if exists "Mentees insert own diagnostic shares" on public.diagnostic_shares;
create policy "Mentees insert own diagnostic shares"
  on public.diagnostic_shares for insert to authenticated
  with check (
    mentee_id = auth.uid()
    and mentor_id <> auth.uid()
    and (quiz_response_id is null or public.owns_quiz_response(quiz_response_id))
    and (diagnostic_session_id is null or public.owns_diagnostic_session(diagnostic_session_id))
  );

-- Update is how a share is revoked or reactivated: keep the target locked to
-- what the caller owns, so an update can't repoint a share at someone else's
-- quiz either.
drop policy if exists "Mentees update own diagnostic shares" on public.diagnostic_shares;
create policy "Mentees update own diagnostic shares"
  on public.diagnostic_shares for update to authenticated
  using (mentee_id = auth.uid() or public.is_admin())
  with check (
    public.is_admin()
    or (
      mentee_id = auth.uid()
      and (quiz_response_id is null or public.owns_quiz_response(quiz_response_id))
      and (diagnostic_session_id is null or public.owns_diagnostic_session(diagnostic_session_id))
    )
  );

-- Shares forged before this fix: a share whose target the mentee doesn't own.
update public.diagnostic_shares s
set revoked_at = now()
where s.revoked_at is null
  and s.quiz_response_id is not null
  and not exists (
    select 1 from public.quiz_responses q
    join auth.users u on u.id = s.mentee_id
    where q.id = s.quiz_response_id
      and (q.user_id = s.mentee_id or q.email = lower(u.email))
  );

-- ─── 2. Quiz analysis limit ────────────────────────────────────────────────
create index if not exists idx_quiz_responses_email_created
  on public.quiz_responses (email, created_at desc);

-- 'ok' | 'email_limit' | 'budget'. Counts only /quiz submissions (rows from
-- the /assistant diagnostic carry a diagnostic_session_id and are metered by
-- the assistant quota instead). Change the limit here, in one place.
create or replace function public.quiz_submission_status(p_email text)
returns text
language plpgsql stable security definer
set search_path = public
as $$
declare
  c_limit constant int := 3;
  c_window constant interval := interval '30 days';
  v_count int;
begin
  if public.ai_budget_exhausted() then
    return 'budget';
  end if;

  select count(*) into v_count
  from public.quiz_responses q
  where q.email = lower(trim(p_email))
    and q.diagnostic_session_id is null
    and q.created_at > now() - c_window;

  if v_count >= c_limit then
    return 'email_limit';
  end if;

  return 'ok';
end;
$$;

revoke all on function public.quiz_submission_status(text) from public;
grant execute on function public.quiz_submission_status(text) to anon, authenticated;

drop policy if exists "Public can submit quiz responses" on public.quiz_responses;
create policy "Public can submit quiz responses"
  on public.quiz_responses for insert to anon
  with check (
    user_id is null
    and ai_analysis is null
    and processed_at is null
    and score is null
    and coalesce(email_sent, false) = false
    and email_sent_at is null
    and public.quiz_submission_status(email) = 'ok'
  );

-- Rows inserted already processed (the /assistant diagnostic) never reach
-- claim_quiz_analysis, so they cost no quiz analysis and skip the limit.
drop policy if exists "Authenticated can submit own quiz responses" on public.quiz_responses;
create policy "Authenticated can submit own quiz responses"
  on public.quiz_responses for insert to authenticated
  with check (
    public.is_admin()
    or (
      user_id = auth.uid()
      and (processed_at is not null or public.quiz_submission_status(email) = 'ok')
    )
  );
