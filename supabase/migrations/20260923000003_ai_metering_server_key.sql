-- Only the server may write AI usage (fixes 20260923000002).
--
-- The problem: `record_ai_usage` was executable by any authenticated user, who
-- could call it straight from the Supabase REST API with up to 10M tokens per
-- call. One forged row (~US$ 28 on gemini-3.5-flash-lite) exhausts the global
-- `ai_budget`, and `consume_ai_quota` then blocks AI for every user until the
-- next month. Any usage number reported by a caller the user controls is
-- forgeable, so per-run caps would only shrink the damage, not remove it.
--
-- The fix: `record_ai_usage` now requires a server key that only lives in the
-- server's environment (`AI_METERING_KEY`). The database stores its SHA-256 in
-- a `private` schema that PostgREST does not expose. The call still runs with
-- the user's session, so `auth.uid()` keeps attributing usage to the right
-- person, and there is still no service_role.
--
-- Setup (once, after applying this migration):
--   1. Generate a key:   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
--   2. Put it in Vercel (Production + Preview) and .env.local as AI_METERING_KEY.
--   3. In the SQL Editor:
--        insert into private.ai_settings (key, value)
--        values ('metering_key_sha256', encode(extensions.digest('<the key>', 'sha256'), 'hex'))
--        on conflict (key) do update set value = excluded.value;
-- Until step 3, every metering call is rejected (logged as a warning by the
-- app, the user's request still works).

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.ai_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
revoke all on private.ai_settings from public, anon, authenticated;

-- The old signature must go: CREATE OR REPLACE with a new parameter would add
-- an overload and leave the keyless version callable.
drop function if exists public.record_ai_usage(text, text, text, int, int, int, int, text, text, uuid);

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
  if v_uid is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

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

revoke execute on function public.record_ai_usage(text, text, text, text, int, int, int, int, text, text, uuid) from public, anon;
grant execute on function public.record_ai_usage(text, text, text, text, int, int, int, int, text, text, uuid) to authenticated;

-- ─── Pricing corrections and the models of AI_PLATFORM_PLAN.md §11.2 ────────
-- Prices are append-only (new effective_from), so costs already recorded stay
-- as they were. Checked 2026-09-23 against the providers' official pages:
-- gemini-3.5-flash-lite has no context caching, and Groq publishes no cached
-- price for gpt-oss-20b (NULL = cached tokens billed at the input price).
insert into public.ai_model_pricing (provider, model, input_per_mtok, output_per_mtok, cached_input_per_mtok, effective_from, notes) values
  ('google', 'gemini-3.5-flash-lite', 0.30,  2.50, null,  '2026-09-23', 'No context caching on this model'),
  ('groq',   'openai/gpt-oss-20b',    0.075, 0.30, null,  '2026-09-23', 'Groq publishes no cached-input price'),
  ('groq',   'openai/gpt-oss-120b',   0.15,  0.60, null,  '2026-09-23', 'Groq list price'),
  ('google', 'gemini-2.5-flash-lite', 0.10,  0.40, 0.01,  '2026-09-23', 'Gemini API paid tier'),
  ('google', 'gemini-2.5-flash',      0.30,  2.50, 0.03,  '2026-09-23', 'Gemini API paid tier'),
  ('google', 'gemini-3.8-flash',      0.75,  3.75, 0.075, '2026-09-23', 'Promotional price through 2026-12-31'),
  ('google', 'gemini-3.8-flash',      1.50,  7.50, 0.15,  '2027-01-01', 'Standard price from 2027-01-01'),
  ('openai', 'gpt-5-mini',            0.25,  2.00, 0.025, '2026-09-23', 'OpenAI list price'),
  ('openai', 'gpt-5-nano',            0.05,  0.40, 0.005, '2026-09-23', 'OpenAI list price')
on conflict do nothing;
