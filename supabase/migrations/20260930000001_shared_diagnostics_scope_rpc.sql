-- Enforce the diagnostic share scope in the database (2026-09-30).
--
-- Before: "Mentors read shared quiz responses" granted SELECT on the WHOLE
-- quiz_responses row as soon as an active share existed, whatever its scope,
-- and the 'summary' filter lived only in JavaScript
-- (diagnostic-shares.service.ts). A mentor holding a 'summary' share could
-- therefore query quiz_responses directly with their own JWT and read
-- `personal_life_help` - the one field the sharing modal promises stays
-- "estritamente oculta" - plus `name`, `email` and `linkedin_url`, which the
-- mentor UI never shows at all. The same held for
-- `diagnostic_sessions.state`, the raw answer slots of the chat diagnostic.
--
-- After: mentors have no direct SELECT on either table. They read shares
-- through `get_shared_diagnostics_for_mentor`, which returns only the
-- columns the mentor UI renders and blanks `personal_life_help` unless the
-- share is 'full'. Same shape as `get_quiz_result` (migration …000005).

drop policy if exists "Mentors read shared quiz responses" on public.quiz_responses;
drop policy if exists "Mentors read shared diagnostic sessions" on public.diagnostic_sessions;

-- Mentee name/avatar come from `profiles` here on purpose: a mentor may see
-- who shared a diagnostic with them (the same connection
-- `profile_is_connected` already recognises, migration …150000), and reading
-- it inside the definer keeps that independent of profiles' own RLS.
--
-- `p_share_id` null = every active share for this mentor (dashboard list);
-- a value = that one share (detail view), still restricted to this mentor.
create or replace function public.get_shared_diagnostics_for_mentor(p_share_id uuid default null)
returns table (
  share_id uuid,
  quiz_response_id uuid,
  diagnostic_session_id uuid,
  scope text,
  created_at timestamptz,
  mentee_id uuid,
  mentee_full_name text,
  mentee_avatar_url text,
  analysis jsonb,
  development_areas text[],
  current_challenge text,
  future_vision text,
  career_moment text,
  personal_life_help text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id,
    s.quiz_response_id,
    s.diagnostic_session_id,
    s.scope,
    s.created_at,
    s.mentee_id,
    p.full_name,
    p.avatar_url,
    q.ai_analysis,
    q.development_areas,
    q.current_challenge,
    q.future_vision,
    q.career_moment,
    -- The privacy promise of the 'summary' scope, enforced here instead of
    -- in the caller. Name/e-mail/LinkedIn are simply never selected.
    case when s.scope = 'full' then q.personal_life_help end
  from public.diagnostic_shares s
  left join public.profiles p on p.id = s.mentee_id
  left join public.quiz_responses q
    on q.id = s.quiz_response_id
    or (s.quiz_response_id is null and q.diagnostic_session_id = s.diagnostic_session_id)
  where s.mentor_id = auth.uid()
    and s.revoked_at is null
    and (p_share_id is null or s.id = p_share_id)
  order by s.created_at desc
$$;

-- auth.uid() is null for anon, so the function would return nothing anyway;
-- not granting it keeps that explicit.
revoke all on function public.get_shared_diagnostics_for_mentor(uuid) from public, anon;
grant execute on function public.get_shared_diagnostics_for_mentor(uuid) to authenticated;
