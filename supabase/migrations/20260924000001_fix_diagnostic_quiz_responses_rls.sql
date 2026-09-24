-- Migration: Fix quiz_responses RLS for authenticated diagnostic submissions
--
-- Problem: Migration 20260923000005 restricted all INSERTs to `ai_analysis is null and processed_at is null`
-- to prevent anonymous quiz tampering. However, the authenticated AI diagnostic in /assistant generates
-- the analysis server-side and saves it directly with `user_id = auth.uid()`, which violated this policy.
--
-- Fix:
-- 1. Anonymous users (`anon`) can only insert lead-capture rows (ai_analysis IS NULL).
-- 2. Authenticated users (`authenticated`) can insert and update their own responses (user_id = auth.uid()).

drop policy if exists "Public can submit quiz responses" on public.quiz_responses;
drop policy if exists "Authenticated can submit own quiz responses" on public.quiz_responses;
drop policy if exists "Users update own quiz responses" on public.quiz_responses;

-- Anonymous users (public event quiz / lead capture)
create policy "Public can submit quiz responses"
  on public.quiz_responses for insert to anon
  with check (
    user_id is null
    and ai_analysis is null
    and processed_at is null
    and score is null
    and coalesce(email_sent, false) = false
    and email_sent_at is null
  );

-- Authenticated users (diagnostic in chat)
create policy "Authenticated can submit own quiz responses"
  on public.quiz_responses for insert to authenticated
  with check (
    user_id = auth.uid() or public.is_admin()
  );

-- Authenticated users can update their own responses
create policy "Users update own quiz responses"
  on public.quiz_responses for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

grant insert, update on public.quiz_responses to authenticated;
grant insert on public.quiz_responses to anon;
