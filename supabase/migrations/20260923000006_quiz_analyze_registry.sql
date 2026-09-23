-- Move quiz analysis off supabase/functions/analyze-quiz (gpt-3.5-turbo,
-- service_role, unauthenticated, unmetered) onto the model registry
-- (ADR 0004 §7.3, decision D8 = option A). NOT APPLIED YET.
--
-- Runs AFTER 20260923000005_quiz_responses_privacy.sql, which this depends
-- on: the new flow (POST /api/quiz/[id]/analyze) reads/writes
-- quiz_responses only through the RPCs below, never through a direct
-- `.select()`/`.update()`, because RLS on that table no longer allows an
-- anonymous read (the whole reason this migration exists — the old Edge
-- Function let anyone re-run a paid OpenAI call by just knowing an `id`).
--
-- (a) record_ai_usage now accepts a null auth.uid() when the server key is
--     valid: the quiz can be submitted anonymously, so there is no session
--     to attribute the usage event to. The server key alone already proves
--     the call came from the server (same trust model as every other
--     metered call — 20260923000003).
-- (b) claim_quiz_analysis: atomic claim + read in one RPC. A single
--     UPDATE ... RETURNING is what makes it race-free (same pattern as
--     consume_ai_quota) — two concurrent analyze calls for the same id
--     cannot both claim it. Returns the answer fields the prompt needs, so
--     the route never has to read quiz_responses directly (no second RPC,
--     no widening of read access). Denies the claim when the platform
--     budget (ai_budget) is already exhausted, when already processed, or
--     when claimed in the last 2 minutes (handles a request that started
--     the analysis but never called save_quiz_analysis — a crash, a
--     timeout — without blocking the row forever).
-- (c) save_quiz_analysis: writes the result and clears the claim.

-- ─── (a) record_ai_usage: allow anonymous, server-authenticated calls ───────
create or replace function public.record_ai_usage(
  p_server_key text,
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
  v_expected text;
  v_in int := least(greatest(coalesce(p_input_tokens, 0), 0), 10000000);
  v_out int := least(greatest(coalesce(p_output_tokens, 0), 0), 10000000);
  v_cached int := least(greatest(coalesce(p_cached_input_tokens, 0), 0), v_in);
  v_price public.ai_model_pricing%rowtype;
  v_cost numeric(14, 8);
  v_id uuid;
begin
  -- No "authentication required" check here (unlike consume_ai_quota, which
  -- is a per-user gate): the server key is what authorizes this call, and
  -- v_uid may legitimately be null (an anonymous quiz taker).
  select s.value into v_expected from private.ai_settings s where s.key = 'metering_key_sha256';
  if v_expected is null
     or p_server_key is null
     or encode(extensions.digest(p_server_key, 'sha256'), 'hex') <> v_expected then
    raise exception 'metering not authorized' using errcode = '42501';
  end if;

  select * into v_price
  from public.ai_model_pricing p
  where p.provider = p_provider and p.model = p_model and p.effective_from <= now()
  order by p.effective_from desc
  limit 1;

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
    v_uid,
    case when v_uid is null then '{}'::text[] else public.ai_user_roles(v_uid) end,
    p_feature, p_run_id, left(p_provider, 40), left(p_model, 80),
    v_in, v_out, v_cached,
    greatest(p_latency_ms, 0), v_cost, p_status, left(p_error_code, 120)
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- Anonymous quiz submissions call this too now, through the server-key gate.
grant execute on function public.record_ai_usage(text, text, text, text, int, int, int, int, text, text, uuid) to anon;

-- ─── quiz_responses: track an in-flight claim ────────────────────────────
alter table public.quiz_responses add column if not exists analysis_claimed_at timestamptz;

-- ─── (b) claim_quiz_analysis ──────────────────────────────────────────────
create or replace function public.claim_quiz_analysis(p_server_key text, p_id uuid)
returns table (
  claimed boolean,
  name text,
  career_moment text,
  mentorship_experience text,
  development_areas text[],
  current_challenge text,
  future_vision text,
  share_knowledge text,
  personal_life_help text
)
language plpgsql security definer
set search_path = public
as $$
declare
  v_expected text;
  v_row public.quiz_responses%rowtype;
begin
  select s.value into v_expected from private.ai_settings s where s.key = 'metering_key_sha256';
  if v_expected is null
     or p_server_key is null
     or encode(extensions.digest(p_server_key, 'sha256'), 'hex') <> v_expected then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if public.ai_budget_exhausted() then
    return query select false, null::text, null::text, null::text, null::text[], null::text, null::text, null::text, null::text;
    return;
  end if;

  update public.quiz_responses q
  set analysis_claimed_at = now()
  where q.id = p_id
    and q.processed_at is null
    and (q.analysis_claimed_at is null or q.analysis_claimed_at < now() - interval '2 minutes')
  returning q.* into v_row;

  if v_row.id is null then
    return query select false, null::text, null::text, null::text, null::text[], null::text, null::text, null::text, null::text;
    return;
  end if;

  return query select
    true,
    v_row.name,
    v_row.career_moment,
    v_row.mentorship_experience,
    v_row.development_areas,
    v_row.current_challenge,
    v_row.future_vision,
    v_row.share_knowledge,
    v_row.personal_life_help;
end;
$$;

revoke all on function public.claim_quiz_analysis(text, uuid) from public;
grant execute on function public.claim_quiz_analysis(text, uuid) to anon, authenticated;

-- ─── (c) save_quiz_analysis ────────────────────────────────────────────────
create or replace function public.save_quiz_analysis(
  p_server_key text,
  p_id uuid,
  p_analysis jsonb,
  p_score int default null
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_expected text;
begin
  select s.value into v_expected from private.ai_settings s where s.key = 'metering_key_sha256';
  if v_expected is null
     or p_server_key is null
     or encode(extensions.digest(p_server_key, 'sha256'), 'hex') <> v_expected then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.quiz_responses
  set ai_analysis = p_analysis,
      score = p_score,
      processed_at = now(),
      analysis_claimed_at = null
  where id = p_id;
end;
$$;

revoke all on function public.save_quiz_analysis(text, uuid, jsonb, int) from public;
grant execute on function public.save_quiz_analysis(text, uuid, jsonb, int) to anon, authenticated;
