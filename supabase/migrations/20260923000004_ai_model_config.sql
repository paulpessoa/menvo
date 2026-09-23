-- Model registry by capability (AI_PLATFORM_PLAN.md §1 principle 3, §11.2;
-- ADR 0004). NOT APPLIED YET — review first.
--
-- Why a table: "model is configuration, not code". Each call site asks for a
-- capability (`extract`, `converse`, `analyze`, …) and `lib/ai/models`
-- resolves it to provider + model + ordered fallbacks. Swapping a model is an
-- UPDATE here, no deploy. The code keeps a built-in copy of this seed and uses
-- it whenever this table is empty, unreadable or holds an invalid row, so a
-- bad edit or an outage degrades to the defaults instead of taking AI down.
--
-- Guardrail: every model referenced here (primary and fallbacks) must have a
-- row in `ai_model_pricing`. An unpriced model records `cost_usd = null`, which
-- the global `ai_budget` would count as free — the trigger below refuses it.
--
-- `stt` (§11.2) is not seeded: speech-to-text is Fase 3 and is billed per
-- audio minute, which `ai_model_pricing` doesn't model yet.

create table if not exists public.ai_model_config (
  capability text primary key check (capability ~ '^[a-z_]{2,40}$'),
  provider text not null check (provider in ('google', 'groq', 'openai')),
  model text not null check (length(model) between 1 and 100),
  -- Provider-neutral knobs, validated by Zod in lib/ai/models:
  -- { temperature?, maxOutputTokens?, maxRetries?, timeoutMs? }
  params jsonb not null default '{}'::jsonb check (jsonb_typeof(params) = 'object'),
  -- Ordered: [{ "provider": "...", "model": "...", "params": { ... } }, …]
  fallback jsonb not null default '[]'::jsonb check (jsonb_typeof(fallback) = 'array'),
  -- false = row ignored, the code default for this capability is used.
  -- Turning a feature off is `ai_entitlements`' job, not this table's.
  active boolean not null default true,
  notes text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- ─── Guardrail: no unpriced model, well-formed fallback entries ───────────────
create or replace function public.ai_model_config_validate()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_entry jsonb;
begin
  if not exists (
    select 1 from public.ai_model_pricing
    where provider = new.provider and model = new.model
  ) then
    raise exception 'ai_model_config: % / % has no row in ai_model_pricing', new.provider, new.model
      using errcode = '23514';
  end if;

  for v_entry in select * from jsonb_array_elements(new.fallback) loop
    if jsonb_typeof(v_entry) <> 'object'
       or coalesce(v_entry ->> 'provider', '') not in ('google', 'groq', 'openai')
       or coalesce(v_entry ->> 'model', '') = ''
       or (v_entry ? 'params' and jsonb_typeof(v_entry -> 'params') <> 'object') then
      raise exception 'ai_model_config: malformed fallback entry %', v_entry
        using errcode = '23514';
    end if;
    if not exists (
      select 1 from public.ai_model_pricing
      where provider = v_entry ->> 'provider' and model = v_entry ->> 'model'
    ) then
      raise exception 'ai_model_config: fallback % / % has no row in ai_model_pricing',
        v_entry ->> 'provider', v_entry ->> 'model'
        using errcode = '23514';
    end if;
  end loop;

  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;

drop trigger if exists ai_model_config_validate on public.ai_model_config;
create trigger ai_model_config_validate
  before insert or update on public.ai_model_config
  for each row execute function public.ai_model_config_validate();

-- ─── RLS: same pattern as ai_model_pricing / ai_entitlements ─────────────────
-- Readable by any logged-in user (the server reads it with the user's session;
-- model names are not secret), writable only by platform admins. No anon
-- access: anonymous callers get the code defaults. No service_role.
alter table public.ai_model_config enable row level security;

create policy "Model config is readable by authenticated users"
  on public.ai_model_config for select to authenticated using (true);
create policy "Admins manage model config"
  on public.ai_model_config for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

revoke all on public.ai_model_config from anon;

-- ─── Seed (§11.2, 2026-09-23). Keep in sync with DEFAULT_MODEL_CONFIG in
-- lib/ai/models/defaults.ts (a unit test compares them). ───────────────────
-- gpt-5-mini is a reasoning model and rejects a custom temperature, so its
-- params omit it on purpose.
insert into public.ai_model_config (capability, provider, model, params, fallback, notes) values
  ('route', 'google', 'gemini-2.5-flash-lite',
    '{"temperature": 0, "maxOutputTokens": 64, "maxRetries": 1}',
    '[{"provider": "groq", "model": "openai/gpt-oss-20b", "params": {"temperature": 0, "maxOutputTokens": 64}}]',
    'Intent classification when rules do not decide.'),
  ('extract', 'google', 'gemini-2.5-flash-lite',
    '{"temperature": 0, "maxOutputTokens": 512, "maxRetries": 1}',
    '[{"provider": "groq", "model": "openai/gpt-oss-20b", "params": {"temperature": 0, "maxOutputTokens": 512}}]',
    'Free text/voice -> structured slot.'),
  ('followup', 'google', 'gemini-2.5-flash-lite',
    '{"temperature": 0.4, "maxOutputTokens": 150, "maxRetries": 1}',
    '[{"provider": "groq", "model": "openai/gpt-oss-20b", "params": {"temperature": 0.4, "maxOutputTokens": 150}}]',
    'One follow-up question.'),
  ('converse', 'google', 'gemini-3.5-flash-lite',
    '{"temperature": 0.3, "maxOutputTokens": 1024, "maxRetries": 1}',
    '[{"provider": "groq", "model": "openai/gpt-oss-120b", "params": {"temperature": 0.3, "maxOutputTokens": 1024}}]',
    'Copilot with tools (/api/assistant). Replaces qwen/qwen3.8-27b.'),
  ('analyze', 'google', 'gemini-2.5-flash',
    '{"temperature": 0.4, "maxOutputTokens": 2048, "maxRetries": 1}',
    '[{"provider": "openai", "model": "gpt-5-mini", "params": {"maxOutputTokens": 2048}}]',
    'Final diagnostic analysis. Replaces gpt-3.5-turbo (analyze-quiz).'),
  ('classify_batch', 'google', 'gemini-2.5-flash-lite',
    '{"temperature": 0, "maxOutputTokens": 256, "maxRetries": 2}',
    '[]',
    'Daily feedback theme job; not interactive.'),
  -- Not in §11.2: AI mentor match (/api/ai/match, waiting-list match). Seeded
  -- with what production runs today so this migration changes no behavior;
  -- move primary to gemini-2.5-flash-lite only after `npm run eval:match` passes.
  ('rank', 'openai', 'gpt-4o-mini',
    '{"temperature": 0.2, "maxOutputTokens": 1024, "maxRetries": 1}',
    '[{"provider": "groq", "model": "openai/gpt-oss-20b", "params": {"temperature": 0.2, "maxOutputTokens": 1024}}]',
    'Mentor match over a short candidate list. Deterministic keyword fallback stays in code.')
on conflict (capability) do nothing;
