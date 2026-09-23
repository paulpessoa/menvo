-- Close the quiz_responses leak (audit 2026-09-23, STATUS.md journal).
-- Approved by the founder on 2026-09-23. NOT APPLIED YET.
--
-- Before: SELECT policy `USING (true)` for everyone, so anyone with the public
-- anon key could list every row (name, e-mail, LinkedIn, personal-life answer,
-- AI analysis). After: a logged-in user reads only rows matching their JWT
-- e-mail (Auth requires e-mail confirmation), the anonymous results page reads
-- one row by UUID through an RPC that returns only what the page shows, and
-- the org dashboard asks "did the quiz?" through an org-admin-only RPC.
--
-- Deploy together with the matching code (same release), or /quiz breaks:
--   - lib/services/quiz/quiz.service.ts: submitQuiz generates the UUID on the
--     client and inserts without `.select()`; getQuizResponseById calls
--     `get_quiz_result`.
--   - lib/services/organizations/org-dashboard.service.ts: uses
--     `org_members_quiz_done` instead of selecting quiz_responses.

drop policy if exists "Anyone can read responses by email" on public.quiz_responses;
drop policy if exists "Public can submit quiz responses" on public.quiz_responses;

create policy "Users read own quiz responses"
  on public.quiz_responses for select to authenticated
  using (email = lower(auth.jwt() ->> 'email') or public.is_admin());

-- Anonymous submission stays (event lead capture, decision D1), but the client
-- can no longer plant an analysis, a score or "e-mail already sent" flags.
create policy "Public can submit quiz responses"
  on public.quiz_responses for insert to anon, authenticated
  with check (
    ai_analysis is null and processed_at is null and score is null
    and coalesce(email_sent, false) = false and email_sent_at is null
  );

-- The results URL is shared on LinkedIn by design, so it must not expose name,
-- e-mail or the raw answers: only the three fields the page renders.
create or replace function public.get_quiz_result(p_id uuid)
returns table (id uuid, processed_at timestamptz, ai_analysis jsonb)
language sql
stable
security definer
set search_path = public
as $$
  select q.id, q.processed_at, q.ai_analysis
  from public.quiz_responses q
  where q.id = p_id
$$;

revoke all on function public.get_quiz_result(uuid) from public;
grant execute on function public.get_quiz_result(uuid) to anon, authenticated;

-- Org admins see which active members did the quiz, never other rows.
create or replace function public.org_members_quiz_done(p_org uuid)
returns table (email text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct q.email
  from public.quiz_responses q
  join public.profiles p on lower(p.email) = q.email
  join public.organization_members m on m.user_id = p.id
  where m.organization_id = p_org
    and m.status = 'active'
    and public.is_org_admin(p_org)
$$;

revoke all on function public.org_members_quiz_done(uuid) from public, anon;
grant execute on function public.org_members_quiz_done(uuid) to authenticated;

-- Defense in depth: RLS already denies update/delete (no policies), but
-- TRUNCATE ignores RLS entirely.
revoke select, update, delete, truncate, references, trigger on public.quiz_responses from anon;
revoke update, delete, truncate, references, trigger on public.quiz_responses from authenticated;
