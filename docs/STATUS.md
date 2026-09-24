# 💓 STATUS — Single Source of Truth

> Merges what used to be three overlapping files (`HEARTBEAT.md`, `BACKLOG.md`,
> `JOURNAL.md`) into one: current health, standing product/architecture
> invariants, the active backlog, and a chronological engineering log.

## 📅 Last Updated: 2026-09-24
**Current status:** Multi-tenant Phase 1 shipped and merged (organizations,
invite/request/approve membership, org admin dashboard). Phase 1.5
(role-aware reporting, public/invite-only orgs, coherent emails, SEO) is
planned in [`domains/organizations.md`](domains/organizations.md) §6, not
started.

---

## 🚦 System Health
- **TypeScript:** 0 errors (`npx tsc --noEmit`)
- **Unit Tests:** 211/211 passed across 43 test suites (`npm test`)
- **Production Build:** 66/66 pages generated successfully (`npm run build`)
- **Runtime:** Next.js 15 (App Router) + React 19 + Tailwind CSS + Supabase Auth & PostgreSQL

---

## 📍 Architectural & Product Invariants

### 1. Brand Identity & Button Design System
- **Official Brand Color:** `#007585` (Deep Teal / Verde Petróleo Menvo).
- **CSS Token:** `--primary: 187 100% 26%` in `app/[locale]/globals.css` (resolves to `#007585`).
- **Tailwind Config:** `primary.600: "#007585"`, `primary.700: "#006276"`.
- **Button Standards (`components/ui/button.tsx`):**
  - **Border Radius:** `rounded-xl` por padrão em toda a aplicação.
  - **Microinterações:** `active:scale-[0.98]` e hover com sombras de marca (`shadow-md shadow-primary/20`).
  - **Variante Outline:** `border-2 border-border bg-background hover:bg-muted/60 active:scale-[0.98]`.
  - **Minimalismo Text-Only:** Botões de ação devem exibir apenas texto puro legível. Proibido adicionar setinhas decorativas (`ArrowRight`) ou ícones redundantes.
  - **Exceções Legítimas:** Spinners de loading (`Loader2`), logos oficiais de terceiros (Google/LinkedIn) e botões exclusivamente de ícone (`size="icon"`).
- **Email Design:** All Brevo transactional emails strictly use `#007585` for CTAs and buttons.

### 2. Mentorship Evaluation Model
- **Asymmetric by Design:** Only mentees evaluate mentors (`!isMentor`).
- **Purpose:** Testimonials and 1-to-5 star ratings construct the mentor's public profile credibility. Mentees do not have public catalog ratings.
- **Card Action:** The "Avaliar Mentoria" button is strictly hidden from mentors and only revealed to mentees on past, confirmed/completed sessions.

### 3. Scheduling & Availability Engine
- **Weekly Recurring Slots:** Mentors configure weekday recurring availability (minimum interval: 45 minutes).
- **14-Day Rolling Window:** Slots are projected dynamically up to 14 days in advance.
- **Conflict Filtering:** Suppresses colliding slots against both internal appointments and Google Calendar `freebusy.query`.
- **Reference:** See [`docs/domains/scheduling.md`](domains/scheduling.md).

### 4. Database Portability (BFF Architecture)
- **Rule:** UI components must never query Supabase directly.
- **Direction:** All client mutations and queries must flow through internal Next.js API routes (`/api/...`) to ensure zero-downtime database migration away from Supabase in the future.
- **Auth Session:** Managed via `lib/auth/auth-context.tsx` reading `/api/auth/me` and `/api/profile` (cookie-authenticated).

### 5. Multi-Tenant Organizations (added 2026-09-17)
- **Membership is stateful, not binary:** `organization_members.status`
  is `invited | requested | active`. The person controls it from
  `/profile?tab=organizations`; the org admin controls it from
  `/dashboard/org`. Nobody is auto-tagged into an org at signup.
- **A member's "kind" (beneficiary vs org mentor) is derived**, never a
  separate field — it's whatever `user_roles` already says the person is
  (mentor or mentee). See roadmap §6 for the reporting split this enables.
- **RLS org-admin checks go through `is_org_admin()`** (security definer),
  never a policy that selects from its own table — Postgres rejects direct
  self-referential `USING` clauses as recursion.
- **Reference:** [`docs/domains/organizations.md`](domains/organizations.md).

---

## 🎯 Active Backlog

### 🟠 P1 — High Priority
- [x] Mentor Search & Filtering Polish, Mentee Activation funnel tracking, Session Feedback Loop, Auth Context & Role Decoupling, Dashboard Simplification — all completed pre-2026-09-16, see journal below for detail.

### 🟡 P2 — Medium Priority
- [x] Profile & Calendar Sync Polish, In-App Notifications Hub, Database Portability/BFF audit, Transactional Email Hardening, Brand Color Harmonization, Evaluation Flow Distinction, Admin Breadcrumb Unification.

### 🔵 P3 — Future / Strategic
- [x] **UI Width/Container Standardization:** Shared `PageContainer` component, 1280px cap app-wide, obsolete `AdminBreadcrumb` removed.
- [x] **`/mentors` Dead-Click Fix:** Whole `MentorCard` interactive, dismissable filter chips (found via Clarity).
- [x] **Multi-Tenant Phase 1:** Organizations, invite/request/approve membership, org admin dashboard, platform admin org CRUD. Shipped in PR #45.
- [ ] **Multi-Tenant Phase 1.5:** Role-aware member reporting (beneficiaries vs org mentors), `join_policy` (open/invite-only), coherent per-role emails, sitemap/SEO for org pages. Shipped in code on 2026-09-17 (see journal and [`domains/organizations.md`](domains/organizations.md) §6).
- [x] **AI-First Platform — Fase 0 (Fundação):** Cota mensal + medição de custo no Postgres (`ai_budget`), DTOs enxutos, `@langchain/langgraph`, registro de modelos por capacidade (`lib/ai/models`, ADR 0004), protocolo SSE tipado com Zod (`lib/ai/protocol.ts`), ADRs 0001–0004 e `docs/governance/ai-policy.md`.
- [x] **AI-First Platform — Fase 1 (Diagnóstico Agêntico em Código):** Migração `20260924000000_ai_diagnostic_sessions_and_threads.sql` (`diagnostic_sessions`, `ai_threads`, `ai_messages`, `quiz_responses.user_id`), engine com máquina de estados de 7 passos (`lib/ai-menvo/diagnostic/`), componentes interativos `ChipGroup` e `DiagnosticProgressBar`, rota com streaming SSE (`app/api/assistant/route.ts`), input de voz Web Speech API, salvaguarda de crise (CVV 188) e cota mensal integrada.
- [x] **AI-First Platform — Fase 2 (Copiloto por Papel, Briefing e Ferramentas RBAC):** Briefing determinístico sem tokens (`/api/assistant/briefing`), tools com RBAC por papel (`getMyAppointments`, `getPendingEvaluations`, `getMentorRequests`), prompt de sistema adaptativo por papel (`mentee`, `mentor`, `admin`), e navegação fluida por chips de atalho.
- [ ] **Paid tier / BYOK (far future):** only after `/dashboard/admin/ai-usage` shows real cost per active user. Entitlements are already per role, so a paid plan = a new role (e.g. `supporter`) with higher limits; BYOK = a per-user provider key resolved before the provider list in the AI service.
- [ ] **AI Assistant Phase 2 (Contexto Avançado):** Integrar a verificação de conclusão do `/quiz` ao contexto do agente para que ele possa questionar o usuário sobre insights recebidos ou sugerir ativamente o quiz se a pessoa estiver desorientada e ainda não tiver feito.

---

## 📓 Engineering Journal

### 2026-09-24 — AI-First Platform: Fase 2 (Copiloto por Papel, Briefing Determinístico e Ferramentas RBAC)
- **Why:** Provide a proactive, tailored copilot experience for mentees, mentors, and admins that requires zero initial LLM tokens on open and provides secure, role-restricted operational tools.
- **Deterministic Zero-Token Briefing (`lib/ai-menvo/copilot/briefing.ts`, `app/api/assistant/briefing/route.ts`):**
  - Computes user profile, resolved primary role (`user_roles`), current month diagnostic completion status & report link, upcoming sessions, and pending action counts (unreviewed completed sessions for mentees, pending session requests for mentors).
  - Generates time-of-day greeting and actionable chips (`mode:diagnostic`, `link:...`, or conversational shortcut).
  - Integrated into `/assistant` UI on load when `!isDiagnosticMode && messages.length === 0`.
- **Role-Aware Copilot Agent & RBAC Tools (`lib/services/assistant/agent.ts`, `lib/services/assistant/tools.ts`):**
  - Added `getMyAppointments`: queries appointments for logged-in user, formats date, time, partner name, status, meet link.
  - Added `getPendingEvaluations`: strictly obeys Invariant #2 (mentors never evaluate mentees), checks completed appointments without reviews for mentees.
  - Added `getMentorRequests`: exposes pending requests for mentors.
  - Dynamically builds role-specialized system prompt (`mentor` vs `mentee` vs `admin`) and binds only authorized tools per role.
  - Backwards-compatible overload in `getAssistantAgent(supabase, userOrOpts, opts)`.
- **Testing & Verification:**
  - Added unit test suites `lib/ai-menvo/copilot/briefing.test.ts`, `app/api/assistant/briefing/route.test.ts`, `lib/services/assistant/agent.test.ts`, and extended `lib/services/assistant/tools.test.ts`.
  - All 43 test suites / 211 tests passing. Zero TypeScript errors.

### 2026-09-24 — Interactive Mentor Cards & Direct Profile Action Buttons on Diagnostic Results Page
- **Why:** On `/quiz/results/[id]`, suggested mentors were rendered as static informative blocks without the ability to navigate to the mentor's profile or schedule a session.
- **Interactive Mentor Cards (`app/[locale]/quiz/results/[id]/page.tsx`):**
  - Added dynamic resolution of real mentor slugs by querying `mentors_view` on results load (`mentorSlugMap`).
  - Transformed each suggested mentor into an interactive, clickable card with hover effects (`group hover:border-primary/60 hover:shadow-md hover:bg-muted/10 transition-all rounded-2xl`).
  - Added dedicated action button at the bottom of each mentor card: `"Ver Perfil do Mentor"` (with `ExternalLink` icon) pointing to `/mentors/[slug]`, or fallback search `/mentors?search=[nome]` / `/mentors`.
  - Added a global catalog button: `"Explorar Todos os Mentores na Plataforma"`.
- **Search Query Parameter Support (`app/[locale]/mentors/page.tsx`):**
  - Updated mentors catalog to read `search` query parameter on mount and automatically filter the catalog when navigated from diagnostic links.
- **Verified:** `npx tsc --noEmit` (0 errors), `npm test` (40 suites, 199 tests passing).

### 2026-09-24 — Mentor Suggestions in Diagnostic Text, Robust Mentor Card Resolution & Link Action Buttons
- **Why:** During end-to-end testing of `/assistant?mode=diagnostic`, the completed diagnostic response lacked mentor suggestions in the markdown text and didn't display mentor cards (due to strict multi-word ILIKE query on joined development areas in `searchMentors`). Additionally, URLs returned in messages needed to render cleanly as action buttons without dangling raw URLs.
- **Mentor Suggestions & Mentor Cards (`lib/ai-menvo/diagnostic/engine.ts`):**
  - Queried all fields required by `MentorCard` (`slug`, `avatar_url`, `city`, `state`, `country`, `languages`, `inclusive_tags`, `expertise_areas`, etc.) from `mentors_view`.
  - Added multi-tier resolution for interactive mentor cards: (1) mentors identified by name in `analysis.mentores_sugeridos`, (2) mentors scored by match with `development_areas` against topics, skills, job title, and bio, (3) top-rated available platform mentors.
  - Included a dedicated **Mentores Recomendados para seu Momento** section in `finalText` detailing the matched mentor types, real mentor names, availability, and specific reasons.
  - Emitted interactive completion chip button: `"Ver Relatório Completo" -> link:/quiz/results/[id]`.
- **Search Catalog Fallback (`lib/services/assistant/tools.ts`):**
  - Added fallback in `searchMentors`: if specific search query returns 0 matches, automatically falls back to top-rated mentors by relevance so neither the AI Copilot nor the Diagnostic ever returns an empty mentor set.
- **Link-to-Button UI (`app/[locale]/assistant/page.tsx`):**
  - Enhanced `MessageContent` component with clean sentence-level link regex and replacement, rendering links like `/quiz/results/[uuid]` as styled `#007585` buttons with icons (`FileText`, `ExternalLink`) and removing trailing punctuation/awkward phrases ("em .").
- **Verified:** `npx tsc --noEmit` (0 errors), `npm test` (40 suites, 199 tests passing).

### 2026-09-24 — AI Diagnostic RLS Fix, Typewriter Streaming & Heuristic Calibration
- **Why:** During manual verification of `/assistant?mode=diagnostic`, completing step 7 failed with Postgres RLS error on `quiz_responses`, the message bubble lacked live streaming feedback, text popped in all at once without typewriter effect, and skipping the optional question 6 triggered `precisa_refazer = true` in fallback analysis.
- **Migration `20260924000001_fix_diagnostic_quiz_responses_rls.sql`:**
  - Separated anonymous lead-capture inserts (`user_id is null and ai_analysis is null`) from authenticated diagnostic submissions.
  - Added authenticated INSERT & UPDATE policies (`user_id = auth.uid() or public.is_admin()`) allowing server-side completed AI analysis to be persisted safely under RLS.
- **Real-Time Typewriter Streaming & UX:**
  - `app/[locale]/assistant/page.tsx`: added `MessageContent` to automatically detect report links (e.g. `/quiz/results/[id]`) and markdown links, rendering them as styled action buttons (Deep Teal `#007585`, `rounded-xl`, text-only) instead of raw ugly URLs. Added live status indicator inside the streaming message bubble and support for link navigation chips (`link:...`).
  - `lib/ai-menvo/diagnostic/engine.ts`: introduced `streamText()` helper to stream words and markdown chunks with micro-delays over SSE, providing a lifelike typewriter streaming animation for questions and final analysis. Added clear markdown divider (`---`) between acknowledgement and analysis results.
  - `components/assistant/DiagnosticProgressBar.tsx`: added `isProcessing` prop with active spinner and pulse effect.
  - `app/api/assistant/route.ts`: added `export const dynamic = "force-dynamic"` and `"X-Accel-Buffering": "no"` to guarantee zero-buffering over SSE streams.
- **Heuristic Calibration & Quota Protection:**
  - `lib/ai-menvo/diagnostic/analyze.ts`: fixed `hasVagueOrGenericResponses` so optional `personal_life_help` is no longer required to be >20 chars (previously skipping question 6 always triggered `precisa_refazer`).
  - `lib/services/diagnostic/diagnostic.service.ts`: marks session `status: "abandoned"` instead of `"completed"` if `precisa_refazer` is true, so the user is never locked out of their monthly free diagnostic when asked to reflect more.
  - `lib/ai-menvo/diagnostic/engine.ts`: checks quota limit rather than unconditional month lock, so unlimited users/admins are never blocked from testing; only consumes monthly quota when analysis is successful (`!analysis.precisa_refazer`), and emits a restart chip ("Refazer diagnóstico agora" / `reiniciar`).
  - `lib/ai/models/factory.ts`: added support for `GEMINI_API_KEY` alongside `GOOGLE_GENERATIVE_AI_API_KEY`.
- **Verified:** `npx tsc --noEmit` (0 errors), `npm test` (40 suites, 199 tests passing).

### 2026-09-24 — AI Platform Fase 1 Implemented: Agentic Diagnostic State Machine, Interactive Chips & Chat UI
- **Why:** Delivers Fase 1 of `docs/AI_PLATFORM_PLAN.md`: turns the static 8-step anonymous quiz into an interactive, conversational diagnostic inside `/assistant?mode=diagnostic` with state machine progression, voice input, deterministic chips, and mentor matching.
- **Migration `20260924000000_ai_diagnostic_sessions_and_threads.sql`:**
  - `diagnostic_sessions`: tracks user sessions, `current_step`, JSONB `state`, 7-day expiration rolling window, status (`in_progress`, `completed`, `abandoned`), and RLS (`auth.uid() = user_id`).
  - `ai_threads` & `ai_messages`: structured conversational history per user and mode, replacing legacy single-turn tables.
  - `quiz_responses`: added `user_id` and `diagnostic_session_id` columns, updated SELECT/INSERT RLS policies so authenticated users own and read their responses.
  - `profiles`: added `ai_disclosure_accepted_at` for onboarding consent.
  - `ai_entitlements`: seeded monthly limit of 1 diagnostic for default/mentee/mentor, unlimited for admin.
- **Protocol & Features:**
  - `lib/ai/features.ts`: added `"diagnostic"` to `AI_FEATURES`.
  - `lib/ai/protocol.ts`: added `chips`, `progress`, and `diagnostic_complete` events, exported `ChipOption`. Unit-tested round-trip serialization.
- **Diagnostic Engine & Domain Logic (`lib/ai-menvo/diagnostic/`):**
  - `steps.ts`: deterministic definitions of all 7 questions, chips options, schemas, and input types.
  - `extract.ts`: structured extraction using registry capability `extract` (`gemini-2.5-flash-lite` -> `openai/gpt-oss-20b`) when users type free text; includes CVV 188 crisis safeguard check per §12.2.
  - `followup.ts`: ambiguity check and gentle 1-sentence follow-up generator via registry capability `followup`.
  - `engine.ts`: conversational turn orchestrator that advances steps, saves intermediate state, checks/consumes monthly quota, calls `analyzeQuiz` with sanitization against active platform mentors (`mentors_view`), and returns recommended mentor cards via SSE.
- **Service Layer (`lib/services/diagnostic/diagnostic.service.ts`):**
  - Session lifecycle management (active session query, 7-day abandonment, atomic completion, quiz response linking).
- **Interactive UI (`components/assistant/` & `app/[locale]/assistant/page.tsx`):**
  - `ChipGroup.tsx`: single/multi-choice buttons following Menvo button design guidelines (`rounded-xl`, text-only, deep teal primary), "Outro" text input, and "Pular" support.
  - `DiagnosticProgressBar.tsx`: sticky step counter and progress bar with percentage.
  - `page.tsx`: auto-initializes diagnostic mode on first load, renders progress bar, interactive chips, and Web Speech API `VoiceInput`. Wrapped in `<Suspense>`.
- **Verified:** `npx tsc --noEmit` (0 errors), `npm test` (40 suites, 197 tests, all passing), `npm run build` (66/66 pages generated successfully).

### 2026-09-24 — AI Platform Fase 0 Closed Out: Typed SSE Protocol, ADRs 0001–0003, `ai-policy.md`
- **Why:** `AI_PLATFORM_PLAN.md` §8 Fase 0 items 6 and 7 were the only Fase 0 work left that didn't need a DB migration or the founder's input, so this pass finished them to close out Fase 0 before Fase 1 (diagnóstico agêntico) starts.
- **`lib/ai/protocol.ts`:** `aiEventSchema` (Zod discriminated union — `text`, `tool_start`, `mentors_found`, `reset`, `error`), `encodeSseEvent`/`encodeSseDone` (server) and `parseSseLine` (client, never throws — a stream line can arrive mid-chunk). `mentors_found`'s payload is typed as opaque records here, not `lib/services/assistant/tools.ts`'s `mentorCardDto` — `lib/ai/models/boundaries.test.ts` caught the first draft importing it, since `lib/ai/` (the reusable core, plan §10) must not depend on `lib/services/*`; the DTO still validates the payload upstream, in the tool itself.
- **Wired into both ends:** `app/api/assistant/route.ts` now calls `encodeSseEvent`/`encodeSseDone` instead of hand-rolling `JSON.stringify` per event; `app/[locale]/assistant/page.tsx` parses each line with `parseSseLine` instead of its own `JSON.parse` + `data.type` checks. The two sides can no longer drift on event shape. `reset` is defined (for the fallback-mid-stream case ADR 0004 §7.1 flagged) but not yet emitted by the route — no fallback has fired in practice yet to need it.
- **ADRs 0001–0003 written** (retroactively documenting decisions already implemented, same as ADR 0004 was): [0001](governance/adr/0001-langgraph-orchestrator.md) (LangChain/LangGraph as the agent orchestrator, and why `createAgent` over the deprecated `createReactAgent`), [0002](governance/adr/0002-state-in-own-tables.md) (no LangGraph `PostgresSaver` checkpointer — it bypasses RLS, which `AGENTS.md` forbids; state lives in `ai_threads`/`ai_messages`/`diagnostic_sessions` instead), [0003](governance/adr/0003-quota-and-metering-via-security-definer-rpc.md) (quota/budget/metering only through `security definer` RPCs, never `service_role`, same pattern as ADR 0004's model registry).
- **`docs/governance/ai-policy.md` written:** the internal reference for allowed providers/models, the 80%/100% budget behavior (80% still unimplemented — flagged), what data may reach a model (never email/phone/surname; the diagnostic's personal-life answer needs the CVV-interrupt safeguard once Fase 1 builds it), retention (points at plan §12.1), and who can read what (points at `diagnostic_shares`, not yet built).
- **Verified:** `npx tsc --noEmit` (0 errors), `npm test` (38 suites, 185 tests, all passing, including the new `lib/ai/protocol.test.ts`), `npm run build` (55/55 pages).
- **Not done, explicitly out of scope:** 80%-of-budget model degradation (ADR 0004 §10's sketch still stands), applying migrations `20260923000004`/`20260923000006` (founder's call), Fase 1 itself (diagnostic subgraph, `diagnostic_sessions`/`ai_threads`/`ai_messages` tables, `quiz_responses.user_id`).

### 2026-09-23 — Migration History Repaired (`20260922000000`–`20260923000006`)
- **Why:** `npx supabase db push` failed on `20260922000000_mentor_suggestions.sql` (`policy "Anyone can insert suggestions" already exists`). Root cause: the founder had applied migrations `20260922000000` through `20260923000006` directly via the Supabase SQL Editor, so the schema and RLS policies existed, but the CLI's own `supabase_migrations.schema_migrations` history table never recorded them — so the next `db push` tried to re-run everything from `20260922000000` and collided with objects that already existed.
- **Verified against the live DB before touching anything:** every downstream table/column/RPC each migration `20260922000000`–`20260923000006` was supposed to create already existed with matching shape (`profiles.learning_goals`, `ai_usage_events`, `ai_budget`, `private.ai_settings`, `record_ai_usage` accepting a null `auth.uid()`, `ai_model_config` seeded with all 7 capabilities, `get_quiz_result`, the old open `quiz_responses` SELECT policy gone, `claim_quiz_analysis`/`save_quiz_analysis`, `quiz_responses.analysis_claimed_at`). `mentor_suggestions` had 2 real rows.
- **Fixed a real bug found in the same pass:** two migration files shared the identical timestamp `20260923000000` (`chat_feature_flag.sql` and `mentor_suggestions_context.sql`) — an ambiguous version for the CLI. Renamed the latter to `20260922000001_mentor_suggestions_context.sql` (it logically follows the table-creation migration it alters).
- **Repaired, not re-applied:** `npx supabase migration repair --linked --status applied` for `20260922000000`, `20260922000001`, `20260923000000`–`20260923000006` — this only writes rows into the CLI's history table, it runs no SQL against the schema. Confirmed clean afterward with `supabase db push --dry-run` → `"Remote database is up to date."`.
- **`AI_METERING_KEY` confirmed present in every environment** by the founder — cost metering should be recording, not silently rejected.
- **`ai_assistant_flag` brought under version control:** migration `20260923000007_ai_assistant_feature_flag.sql` (same `WHERE NOT EXISTS` pattern as `chat_flag`), seeded `true` to match the manual row already in production. Applied and verified a no-op against the existing row.
- **Not done, needs the founder:** regenerate `lib/types/supabase.ts` via `npm run db:types` if it hasn't picked up the tables/RPCs from `20260923000002`–`20260923000007` yet.

### 2026-09-23 — ADR 0004 Implemented: Model Registry by Capability, `quiz_responses` Privacy Fix Shipped
- **`quiz_responses` privacy fix shipped in code** (migration `20260923000005_quiz_responses_privacy.sql`, applied by the founder before this pass started): `quiz.service.ts`'s `submitQuiz` now generates the id client-side (`crypto.randomUUID()`) and inserts without `.select()` (an anonymous submitter has no SELECT policy any more); `getQuizResponseById` reads through the new `get_quiz_result` RPC (id/processed_at/ai_analysis only) instead of `select('*')`; `org-dashboard.service.ts` reads "did the quiz?" through `org_members_quiz_done` (RPC, `is_org_admin()`-gated) instead of a direct `quiz_responses` select. `/quiz/results/[id]`'s local type narrowed to match (name/email/score were declared but never read).
- **`lib/ai/models`: the model registry** (ADR 0004 §4) — `capabilities.ts`, `schema.ts` (Zod, `.strict()` params), `defaults.ts` (built-in copy of the `ai_model_config` seed, unit-tested against the migration file so they can't drift), `resolve.ts` (pure), `load.ts` (60s cache, 10s error cache, 1.5s read timeout, never throws), `factory.ts` (provider → LangChain class, metering callback attached in the constructor), `index.ts` (`getModel`/`getStructuredModel`/`getAgentModels`, `AiModelUnavailableError` when no provider has a key). `getStructuredModel`'s `schema` param is typed `z.ZodType<T, ZodTypeDef, any>`, not `z.ZodType<T>` — a schema with `.default()` fields legitimately has an `Input` type that diverges from `Output`, and TS's default `Input = Output` rejected it.
- **Metering moved to a per-model callback** (`lib/ai/metering/callback.ts`), replacing `lib/ai/langchain-metering.ts` (removed, along with its test) — `streamEvents` v2 has no `on_chat_model_error`, so a fallback's failed first attempt was invisible to the old collector. The callback is attached in every model's constructor, so it survives `bindTools`/`withStructuredOutput`/`withFallbacks`.
- **Assistant (`converse`) moved off `createReactAgent`** (deprecated) **onto `createAgent` + `modelFallbackMiddleware`** from `langchain` 1.5.11: `withFallbacks` cannot bind tools onto a `RunnableWithFallbacks` (`_bindTools` throws), but `modelFallbackMiddleware` re-runs the same tool-bound request against each fallback model. `getAssistantAgent` is now `async` and takes `{ onCall }`; `app/api/assistant/route.ts` awaits it and feeds `onCall` into a plain array passed to `recordAiCalls`, same as before. `qwen/qwen3.8-27b` is no longer referenced anywhere in code (its `ai_model_pricing` row stays, append-only, for historical cost).
- **Match service resolved through the registry, not raw `fetch`:** `lib/services/ai/groq.service.ts` → `lib/services/ai/match.service.ts` (git mv, 3 call sites + 2 test files updated), capability `rank`, seeded with what production runs today (`gpt-4o-mini` → `openai/gpt-oss-20b`) so applying the migration changes no match behavior. `findOptimalMentors` now takes `supabase` as its first argument.
- **`gpt-3.5-turbo` retired (D8 = option A):** `supabase/functions/analyze-quiz` is superseded by `POST /api/quiz/[id]/analyze` + `lib/ai-menvo/diagnostic/analyze.ts` (same prompt and deterministic fallback, ported), on the registry's `analyze` capability (Gemini 2.5 Flash → `gpt-5-mini`), metered, and inside the global `ai_budget`. Migration `20260923000006_quiz_analyze_registry.sql` (**applied**, see 2026-09-23 migration-history entry below): `record_ai_usage` now accepts a null `auth.uid()` for a server-key-authenticated anonymous call; `claim_quiz_analysis` (atomic claim + read of the 8 answer fields, denies if already processed, claimed in the last 2 minutes, or the budget is exhausted) and `save_quiz_analysis` are the only way the new route touches `quiz_responses` — no widening of the privacy fix above. The old Edge Function is left in place, unused, to delete after a week with no calls in its logs. `quiz_analysis` added to `AI_FEATURES`.
- **Evals updated to compile against the new APIs** (`evals/ai-match.eval.ts`, `evals/assistant.eval.ts`) but **not run** — they cost real LLM calls and this pass had no standing instruction to spend money. `assistant.eval.ts` now runs the suite twice, once normal and once with `AI_FORCE_FALLBACK=converse` (new env var, evals-only, documented in `environment-variables.md`), so a fallback model that can't call tools would actually be caught.
- **`jest.setup.js`** now polyfills `TextEncoder`/`TextDecoder` from `node:util` — jsdom lacks them, and `@langchain/core`'s dependency chain needs them just to be imported. A few new test files also carry `@jest-environment node` (LangChain touches `ReadableStream` on import too).
- **Verified:** `npx tsc --noEmit` (0 errors), `npm test` (36 suites, 175 tests, all passing). `npm run build` run at the end of this pass — see next entry if it needed a fix.
- **Opus review before push (real LLM calls, anonymous client, nothing written to the DB; < US$ 0.01) caught and fixed:** (a) the `analyze` fallback never worked — `gpt-5-mini` uses OpenAI strict Structured Outputs, which rejects the schema's `.default()` fields before sending, so any Gemini failure went straight to the deterministic analysis; and the first fix (`.nullable()`) then broke Gemini itself (`type: ["string","null"]` → 400). The schema is now all-required, non-nullable (`mentor_nome: ""` when none), and both models were verified to answer; (b) Gemini took ~10s (gpt-5-mini ~19s) per analysis with no `maxDuration` on the route — a platform kill after the claim but before the save would leave the results page spinning forever, since it only polled and never re-requested. The route now has `maxDuration = 60`, and the results page re-requests the analysis every ~70s (a no-op while a claim is live) and gives up with the error toast after ~4 min; (c) the Groq fallback metered **0 tokens** in the streaming assistant — ChatGroq streaming leaves `usage_metadata` empty and reports usage only in `response_metadata.usage`; the callback now reads all three places (regression test added). Also verified: `rank` primary (gpt-4o-mini) and fallback (gpt-oss-20b), `converse` primary and forced fallback, and `mentors_found` still carrying cards through `createAgent`.
- **Known, not fixed:** anonymous callers (the quiz) can't read `ai_model_config` (the migration revokes it from `anon`), so `analyze` always uses the code default and logs a `permission denied` warning per 10s window — changing the `analyze` model for the anonymous quiz still needs a deploy until `anon` gets `select` on that table (model names aren't secret; needs the founder's OK). Anyone can still insert quiz rows without limit, and each one gets one paid analysis — now capped by `ai_budget` (US$ 10/month) instead of unbounded, but a spammer could exhaust the month's budget; a per-IP rate limit is the next step. Assistant's primary (Gemini) search found 0 cards for "quero ser professora" where the Groq fallback found 3 — the query the model writes differs; `ai_assistant_flag` is off in production.
- **Not done, explicitly out of scope:** 80%-of-budget degradation to a cheaper model (ADR 0004 §10 sketches the seam: an `economy jsonb` column); the typed SSE protocol; ADRs 0001–0003; `docs/governance/ai-policy.md`; deleting the now-unused `analyze-quiz`/`send-quiz-email` Edge Functions. Migrations `20260923000004`/`20260923000006` were applied by the founder shortly after this pass — see the 2026-09-23 migration-history entry below.

### 2026-09-23 — `quiz_responses` RLS Audit (leak confirmed) + Model Registry Spec (ADR 0004)
- **Audit (read-only; catalog queries via the Management API + anonymous REST `HEAD` counts, no row content read):** RLS is enabled, but the SELECT policy `"Anyone can read responses by email"` is `USING (true)` for role `public`. `anon` and `authenticated` hold every table privilege (`arwdDxtm`). The INSERT policy `"Public can submit quiz responses"` is `WITH CHECK (true)`. No UPDATE/DELETE policy exists, so RLS denies those. **Result: an anonymous visitor with the public anon key can list every row with every column: name, e-mail, LinkedIn, the personal-life answer and the AI analysis.** Confirmed as `anon`: `select=id`, `select=email` and `select=name,linkedin_url,personal_life_help,ai_analysis` each return `0-3/4`. The table has 4 rows today (1 e-mail matches a profile), so exposure is small, but it is a real leak.
- **Related, found in the same pass:** (a) anyone can insert a row with any e-mail and forged `ai_analysis`/`score`; (b) `analyze-quiz` and `send-quiz-email` (Edge Functions, `service_role`) run for any `responseId`. With ids listable, anyone can re-trigger paid OpenAI calls without limit and make Menvo e-mail any stored address; (c) `lib/services/quiz/quiz.service.ts` reads and writes straight from the browser (violates invariant #4); `/quiz/results/[id]` uses only `id`, `processed_at` and `ai_analysis`, but loads `select('*')`, and its "share on LinkedIn" button publishes that URL; (d) the org dashboard (`org-dashboard.service.ts`, user session) reads other members' `quiz_responses.email` and relies on the open policy. Auth has `mailer_autoconfirm = false`, so JWT e-mails are confirmed.
- **Fix proposed, NOT applied (awaiting founder approval):** drop the open SELECT, let `authenticated` read only rows matching their JWT e-mail (or `is_admin()`), serve the results page through a `security definer` RPC by UUID that returns only `id, processed_at, ai_analysis`, tighten the INSERT check (no client-set analysis/score/e-mail flags), add an org-admin RPC for "did the quiz", and revoke `select/update/delete/truncate` from `anon`. Needs matching changes in `quiz.service.ts` (client-generated UUID, insert without `.select()`), the results page and the org dashboard. **Approved by the founder the same day** → `supabase/migrations/20260923000005_quiz_responses_privacy.sql` (**applied**, see 2026-09-23 migration-history entry below).
- **Model registry specified:** [ADR 0004](governance/adr/0004-model-registry-by-capability.md) + migration `supabase/migrations/20260923000004_ai_model_config.sql` (**applied**, see 2026-09-23 migration-history entry below; §11.2 seed plus `rank` for the match with today's models; a trigger refuses unpriced models; RLS same as `ai_model_pricing`). Checked in `node_modules`: `withFallbacks` can't work with `createReactAgent` (its `_bindTools` rejects `RunnableWithFallbacks`), and `createReactAgent` is deprecated. `langchain` 1.5.11's `createAgent` + `modelFallbackMiddleware` binds tools on the fallback model. `streamEvents` v2 has no `on_chat_model_error`, so metering moves to a per-model callback handler. `@langchain/openai` is not installed yet. **D8 decided: option A** — `analyze-quiz` moves into a Next route on the registry (metered, inside the budget, no unlimited re-runs); ADR 0004 §7.3.

### 2026-09-23 — AI Plan Fase 0: Lean Mentor DTO, `langgraph` Dependency, Diagnostic Links, Docs/KB Skeleton
- **`searchMentors` no longer sends full mentor rows to the LLM** (`lib/services/assistant/tools.ts`): added two Zod DTOs — `mentorLlmDto` (slug, name, role, up to 5 skills, bio cut to 200 chars, profileUrl; no email/phone/any other field) and `mentorCardDto` (the full card shape `MentorCard` renders). The tool (`lib/services/assistant/agent.ts`) now uses LangChain's `responseFormat: "content_and_artifact"`: `content` (the lean DTO, stringified) is what the model reads and pays tokens for; `artifact` (the card DTO) rides along on the `ToolMessage` without ever reaching the model. `app/api/assistant/route.ts`'s `mentors_found` SSE event now reads `event.data.output.artifact` instead of the raw tool output, so the UI still gets full cards.
- **`@langchain/langgraph` declared explicitly** in `package.json` (exact `1.4.16`, the version already resolved as a transitive dep of `langchain`; `package-lock.json` synced so `npm ci` doesn't fail) — it was imported directly in `agent.ts` without ever being a first-class dependency.
- **Internal diagnostic links point at the chat, not the anonymous quiz** (plan §9 D1): `MenteeQuizCTA` (both the "take the quiz" and "retake" buttons), `/mentors`' empty-state CTA, and `NotFoundClient`'s discovery link go to `/assistant?mode=diagnostic` (conditionally, see below). The mentee dashboard needed no separate change — it already renders `MenteeQuizCTA`. `/assistant` doesn't read `mode` yet (ignored, as planned); wiring the actual diagnostic subgraph is Fase 1. The anonymous `/quiz` flow (event lead capture) and `/quiz/results/[id]` were left untouched, per D1.
- **`docs/` and `kb/` skeleton created** (plan §6.1): new `docs/README.md` explains the two-tree split and the mandatory frontmatter for `kb/` and `docs/domains/`. Moved the four existing docs into their planned homes and updated every internal link: `SCHEDULING_AND_AVAILABILITY.md` → `domains/scheduling.md`, `MULTI_TENANT_ROADMAP.md` → `domains/organizations.md`, `ENVIRONMENT_VARIABLES.md` → `operations/environment-variables.md`, `SEO_GUIDE.md` → `product/seo.md`. Created the empty target folders (`governance/adr`, `architecture`, `operations/runbooks`, `product`, and all of `kb/`'s subfolders) with `.gitkeep` placeholders — no `kb/` articles written yet, no ADRs, no `ai-policy.md`, per scope.
- **Opus review before commit caught and fixed:** (a) `package-lock.json` didn't list the new direct dependency, which would have broken `npm ci` on Vercel; (b) the assistant asked `searchCatalog` for `page: 1`, but that API is 0-indexed, so it **always skipped the top-rated mentors** (bug existed before this change); (c) the DTO mapping used `any[]` and a strict `.parse` that would crash the whole search on one malformed row, so it now uses `safeParse` and drops bad rows; (d) `organizations.md`'s relative link to `STATUS.md` broke with the move, and `environment-variables.md` had a `file:///c:/Users/...` link. Both are now relative; (e) `domains/scheduling.md` and `domains/organizations.md` got the frontmatter the new README requires. Added `lib/services/assistant/tools.test.ts` (lean DTO keys, bio 200, skills ≤ 5, no email/phone, malformed row dropped, page 0).
- **Verified:** `npx tsc --noEmit` (0 errors), `npm test` (30 suites, 145 tests, all passing).
- **Links resolved (founder accepted the recommendation):** `/assistant` needs login + `ai_assistant_flag` and has no diagnostic mode yet, so a hard link would dead-end anonymous visitors and everyone while the flag is off. New `hooks/useDiagnosticHref.ts` returns `/assistant?mode=diagnostic` only when logged in **and** the flag is on, else `/quiz`; used by `MenteeQuizCTA`, `/mentors` and `NotFoundClient`. `QuizDiscoverySection` (home page, mostly anonymous traffic) stays on `/quiz`.
- **Not done, explicitly out of scope for this pass:** model registry (`lib/ai/models`), SSE protocol typed with Zod, `ai_model_pricing`/`ai_model_config` seed, `quiz_responses` RLS audit, retiring `qwen/qwen3.8-27b`/`gpt-3.5-turbo`, ADRs, `ai-policy.md`, any DB migration or RLS change (none needed).

### 2026-09-23 — AI Monthly Quota + Cost Metering (AI Plan Fase 0, partial)
- **Why:** the platform is non-profit but must pay for itself, so every AI feature needs a hard per-user limit and a known cost before it scales. Limits and costs now live in Postgres (the old 30/day assistant limit was in-memory, i.e. per serverless instance, i.e. not a limit).
- **Migration `20260923000002_ai_usage_and_quota.sql` (applied to the DB on 2026-09-23; the AI routes fail closed without it):** `ai_model_pricing` (USD/1M tokens, new row per price change), `ai_entitlements` (monthly limit per role × feature, `NULL` = unlimited, no row = disabled), `ai_quota_ledger`, `ai_usage_events` (one row per model call incl. failures and keyword fallback, no content). RPCs `consume_ai_quota` (atomic, race-free), `get_ai_quota`, `record_ai_usage` (cost computed in SQL) — all `security definer` reading `auth.uid()`, no insert policies for users, no `service_role`. Views `ai_usage_monthly`, `ai_usage_by_user_monthly` (`security_invoker`).
- **Global ceiling:** `ai_budget` (US$ 10/month, decision D3). When the platform's spend this month reaches it, `consume_ai_quota` denies every non-admin with `reason = 'budget'` (UI says the AI is back next month; regular search keeps working). Hard stop only — no 80% downgrade yet.
- **Security fix (migration `20260923000003_ai_metering_server_key.sql`, applied 2026-09-23; key hash stored in `private.ai_settings`):** `record_ai_usage` was executable by any logged-in user straight from the Supabase REST API, with up to 10M tokens per call — one forged row (~US$ 28) would exhaust the US$ 10 `ai_budget` and block AI for everyone for the rest of the month. Per-run caps were rejected as a fix (client-reported numbers stay forgeable; a few fake accounts still drain it). Now the RPC requires `AI_METERING_KEY`, a server-only env var whose SHA-256 lives in `private.ai_settings` (schema not exposed by PostgREST); the old keyless signature is dropped. Still the user's session (`auth.uid()` attributes usage), still no service_role. Same migration appends corrected/§11.2 prices (append-only, old costs unchanged). **Setup steps are in the migration header**; until done, metering rows are rejected (warned, requests still work). `lib/types/supabase.ts` hand-patched with `p_server_key` — regenerate with `npm run db:types` after applying.
- **Initial limits (edit rows in `ai_entitlements`, no deploy):** AI search `match` 10/month for mentee/mentor, 5 default; assistant 60 mentee / 30 default; admin unlimited but still counted. Month = calendar month in America/Sao_Paulo.
- **Wired:** `/api/ai/match` (credit taken right before the LLM call, metering + demand log in `after()`), `/api/admin/waiting-list/match`, `/api/assistant` (1 credit per message; every model call inside the agent turn metered via `streamEvents` → `lib/ai/langchain-metering.ts`). `/mentors` shows "X de Y buscas com IA este mês" and a clear message at the limit. New admin page `/dashboard/admin/ai-usage` (cost by feature × model, error/fallback counts, unpriced calls, top 20 users by cost).
- **Reusable core:** `lib/ai/{features,quota,metering,langchain-metering}.ts` — no Menvo domain imports. New AI feature = add to `AI_FEATURES` + seed an entitlement row.
- **Scaling seam:** `lib/services/ai/mentor-candidates.service.ts` is the only place that decides which mentors reach the LLM. When the catalog passes ~100 verified mentors, swap its query for Postgres FTS or pgvector top-K; route/quota/metering don't change.
- **Fixed:** `ai_missing_demands` never received a row — the route inserted `matched_count`, a column that didn't exist (added). Match context now also sends `expertise_areas`/`mentorship_topics`, not only `mentor_skills`.
- **Known, not done:** `supabase/functions/analyze-quiz` (OpenAI, `service_role`, anonymous) is neither limited nor metered. Could not verify `ai_missing_demands` RLS allows insert by `authenticated` (table predates migrations) — the route logs a warning if not.

### 2026-09-23 — "Minhas Mentorias" Redesigned Around Next Action
- **8 tabs → 1 switch + 3 sections.** `/mentorship/mentor` had two 4-tab blocks (Recebidas/Solicitadas × Pendentes/Agendadas/Avaliadas/Canceladas), mostly empty. Now: a two-option switch (Recebidas · você como mentor / Solicitadas · você como mentorado, persisted in `?view=requested`, each with its pending-action count), then **Requer sua ação → Próximas sessões → Histórico** (history collapses after 5). `/mentorship/mentee` uses the same board.
- **Grouping is by derived lifecycle, not DB status** (`lib/mentorship/group-appointments.ts`, unit-tested): `confirmed` stays `confirmed` after the session until the mentee evaluates, and unanswered `pending` never expires in the DB — the old tabs kept past sessions under "Agendadas" forever. Card badges now show "Concluído"/"Expirado" for those.
- **One request per perspective** (`hooks/useMyAppointments.ts`, TanStack Query + Zod) instead of up to 8 `AppointmentsList` fetches; confirm/cancel/evaluate invalidate both perspectives.
- **Fixed:** mentor could "Confirmar" an already-expired request; the mentee hero claimed "você tem uma sessão agendada" with zero sessions (replaced by a real `NextSessionCard`); removed the "Biblioteca de Recursos — em desenvolvimento" placeholder; empty card footers.
- **Verified E2E** with Playwright against the real pages using a stateful mock of `/api/*` (no DB access): 32/32 checks incl. confirm, evaluate, perspective switch, reload, mobile 390px.
- **Follow-up: closed the direct-Supabase gap this same session.** Evaluation, feedback editing and both dashboards' stats/upcoming-appointments reads were going straight from client components to Supabase (`mentorshipService.submitFeedbackAndComplete`/`updateFeedback`/`getUserFeedbacks`/`hasPendingEvaluations`/`getMenteeDashboardStats`/`getMenteeUpcomingAppointments`/`getMentorDashboardStats`/`getMentorUpcomingAppointments`), violating invariant #4. Added `POST /api/appointments/complete`, `GET+PATCH /api/appointments/feedback`, `GET /api/dashboard/mentee`, `GET /api/dashboard/mentor` (all service-role, session-authenticated, ownership-checked) and pointed the service functions at them, keeping every call site's signature unchanged. Also fixed two real gaps found while doing this: the evaluate endpoint now rejects a non-mentee reviewer and a duplicate evaluation (server previously trusted the client-side `!isMentor` gate only), and the feedback-edit endpoint now checks `reviewer_id === user.id` (previously anyone with a feedback id could edit anyone's comment). Removed the old `mentorship.received/requested/tabs/resources/newUx` i18n keys (unused after the redesign) from all three locales.
- **Known, not fixed (pre-existing, out of scope today):** `mentorAvailabilityService.addAvailability/updateAvailability/removeAvailability` (used by `/dashboard/mentor/availability`) still write to Supabase directly — `getMentorAvailability`/`setMentorAvailability` already go through `/api/mentors/availability`. `mentorshipSessionsService.requestSession/respondToSession/getMentorSessions/getMenteeSessions/completeSession/cancelSession/getSession/getMentorStats` also call Supabase directly, but are dead code — not imported by any live component (only by unused hooks in `useMentorship.ts`, used only by the unreferenced `ScheduleSessionModal`/`SessionResponseModal`).

### 2026-09-23 — Profile & Onboarding Save Flow Fixed, /profile Tabs Consolidated
- **Every `/profile` save and every mentee onboarding returned 500:** both payloads carry `learning_goals`, a column that never existed in `profiles` (PostgREST rejects the whole UPDATE). Added migration `20260923000001_profiles_learning_goals.sql` (applied to the DB on 2026-09-23).
- **Validation papercuts that also blocked saves:** links without `https://` (e.g. `linkedin.com/in/x`) and an empty slug failed Zod. URLs are now normalized; an empty slug means "keep current"; a duplicate slug returns a clear 409. The UI now toasts the server's actual error instead of a generic one.
- **`/profile` went from 6 tabs to 4** (Perfil · Carreira e Interesses · Mentoria · Organizações), split into `components/profile/*Section.tsx`. Old `?tab=address|interests` links still work via aliases. Mentor-request status now refreshes immediately (the page's own `useProfile` state was never refetched).
- **Local env:** `.env.local`'s `NEXT_PUBLIC_SUPABASE_ANON_KEY` (`sb_publishable_…`) is rejected by Supabase (401); the legacy anon JWT in `.env.production` works. Verified end-to-end with test users `usertest1/2`, `mentortest1/2` (`@menvo.test`).
- **Known, not fixed:** `mentor_skills` is selected by `app/api/ai/match` and the waiting-list match route but isn't a `profiles` column.

### 2026-09-23 — In-App Chat Hidden Behind `chat_flag`
- **Decision:** No in-app chat for now. Mentor↔mentee contact happens on LinkedIn, which pushes the relationship outside the platform. Re-enable when users start asking for a built-in channel.
- **Flag:** `chat_flag` (default `false`, seeded by `20260923000000_chat_feature_flag.sql`, toggled at `/dashboard/admin/feature-flags`).
- **Gated surfaces:** header "Mensagens" menu item + `MessagesBadge`, `/messages` (redirects to `/dashboard`), appointment card Chat button (replaced by the other person's LinkedIn; `linkedin_url` added to `/api/appointments/list`), community "Oferecer ajuda" (opens LinkedIn or profile), mentee profile CTA ("Conversar no LinkedIn"), legacy `mentors/id` "Enviar Mensagem", and `POST /api/chat/send` (403).

### 2026-09-17 — Multi-Tenant Phase 1 Shipped, Membership Model Redesigned
- **Phase 1 built and merged (PR #45):** `organizations` + `organization_members` tables, `/o/[slug]` landing, `/dashboard/admin/organizations` (platform admin CRUD), `/dashboard/org` (org admin dashboard).
- **Founder feedback caught a real design flaw before it shipped wider:** the original "signup tags you into an org" flow had no path for someone who already had an account, and was confusing UX. Replaced with a stateful membership (`invited/requested/active`) controlled from `/profile` and `/dashboard/org`, with three coherent transactional emails.
- **Three production bugs found only by testing against the real DB** (not catchable by `tsc`/jest): infinite RLS recursion on a self-referential policy (fixed with a `security definer` function), Supabase disabling PostgREST aggregates by default (`organization_members(count)` → counted in JS instead), and a suspended org still being readable by platform admins on its public landing page (added an explicit `status = 'active'` filter).
- **Phase 1.5 planned, not started:** role-aware reporting, public vs invite-only org pages, per-role email copy, SEO. See roadmap §6.
- **Unrelated production outage found and fixed mid-session:** `main` was unbuildable since an earlier commit (`a5e4a74c`) put `dynamic(..., { ssr: false })` directly in the Server Component root layout — Next 15 rejects that. Fixed by moving the two deferred client widgets into a small `"use client"` wrapper (`components/DeferredClientWidgets.tsx`).
- **Docs pruned:** removed 11 stale/obsolete docs (v1 organizations deployment guide, superseded architecture maps, dated planning/analytics snapshots); merged `HEARTBEAT.md` + `BACKLOG.md` + `JOURNAL.md` into this file.

### 2026-09-16 — Admin Breadcrumb Unification, Analytics-Driven Bug Fix & Multi-Tenant Planning
- **Unified Admin Breadcrumb:** `AdminBreadcrumb` was only rendered on `/dashboard/admin/users` and its route map pointed at dead `/dashboard/admin/mentors*` routes plus a mismatched `/settings` entry. Moved it into the shared `dashboard/admin/layout.tsx` so every admin page gets a consistent, correctly-mapped breadcrumb (later removed entirely in favor of `PageContainer`-only pages).
- **Fixed `/mentors/undefined` Bug (found via Clarity analytics):** Guarded two mentor-profile links (mentee's favorites list, mentor's "view public profile" quick action) that rendered without a slug/id fallback, producing broken links tracked in production traffic.
- **Clarity MCP Server Connected:** Added `.mcp.json` (Microsoft Clarity Data Export MCP), enabling live analytics queries (sessions, traffic sources, dead/rage clicks, device mix) directly from an agent session.
- **Multi-Tenant Roadmap drafted:** Found that SQL functions referencing `organizations`/`organization_members` still existed in the DB function list even though those tables weren't in the generated types — required a live DB check before any schema work, since the prior organizations module was deliberately removed in favor of the lean mentor-mentee core loop (see "Earlier Milestones" below).

### 2026-09-08 — Mentor Availability BFF & Transactional Email Hardening
- **Mentor Availability BFF Route (`/api/mentors/availability`):** Resolved availability slots not displaying on `/dashboard/mentor/availability` by introducing a dedicated BFF Route Handler (GET and POST) with Zod validation. Replaced client-side anonymous RLS queries with server-authenticated session resolution.
- **Personal Founder Signature (Paul Pessoa):** Implemented email signature for community/relationship touchpoints, with circular portrait, WhatsApp link, LinkedIn/GitHub. Removed decorative emojis across all email templates.
- **Brand Color Harmonization in Emails:** Enforced `#007585` (Deep Teal) across all Brevo templates.
- **Active Cancellation Emails:** Connected `sendAppointmentCancellation` to `/api/appointments/cancel`.
- **Live Email Test Dispatch Center (`/api/admin/emails/send-test`):** Send real Brevo test emails of any template from `/dashboard/admin/emails`.
- **Cron Job Hardening (`/api/cron/appointments`):** Rescheduled to 10:00 UTC (07:00 Brasília) with `CRON_SECRET` auth and precise `America/Sao_Paulo` boundaries.

### 2026-09-07 — Brand Color Standardization, Scheduling Hardening & Core Loop Polish
- **Official Brand Color (#007585):** Harmonized all buttons, cards, and interactive elements, eliminating arbitrary `emerald-600` and legacy indigo/purple accents.
- **Hero Banner Restoration:** Reinstated the `/mentorship/mentee` hero banner with the official brand gradient and functional CTAs.
- **Asymmetric Evaluation Model Enforced:** Restricted public star ratings/testimonials to mentees evaluating mentors.
- **Scheduling Flow Hardening:** Fixed timezone ISO normalization in `/api/appointments/schedule`, added mentor verification status guards.
- **Auth Context API Decoupling:** Replaced direct database queries in `auth-context.tsx` with `/api/auth/me` and `/api/profile`.

### 2026-09-06 — Auth Ecosystem Simplification, Availability Engine & Mobile UX
- **Minute-Based Availability Engine:** Migrated from hour loops to minute-based generator (45-minute step, min duration validation).
- **Google Calendar Conflict Detection:** Integrated `freebusy.query` in `/api/appointments/availability`.
- **Auth Flow Restructuring:** Consolidated password update flows, fixed redirect ping-pong, unified confirmation resend.
- **Mobile Catalog Search:** Redesigned responsive filters sheet, 50/50 action grid, dismissible filter chips.

### 2026-09-05 — Comprehensive Modernization, Decoupling & LLM SEO
- **Architectural Decoupling:** Enforced strict separation of concerns per `AGENTS.md`. Eliminated raw Supabase queries in components, delegating to dedicated services.
- **Geo SEO & LLMs Indexing:** Standardized `public/llms.txt`, `public/llms-full.txt`, AI crawler whitelisting in `robots.txt`.
- **Web Quality & Accessibility:** Font display swap, Schema.org JSON-LD graph, skip-to-content links, Hero image LCP preloading.
- **Strict Typing:** 100% clean `tsc --noEmit` (0 errors across the codebase).

### Earlier Milestones
- **Organization Module Deprecation:** Removed multi-tenant organizations v1 in favor of a lean, direct mentor-to-mentee relationship (later rebuilt leaner — see 2026-09-17 above).
- **Unified Internationalization:** Integrated quiz translations into standard Next-intl `messages/{locale}.json` dictionaries.
- **AI Mentorship Matching:** Implemented GPT-4o-mini powered mentor recommendation engine with deterministic fallback in `/api/ai/match`.

---

## 📚 Documentation Index

| File | Purpose |
|---|---|
| [`docs/domains/organizations.md`](domains/organizations.md) | Multi-tenant organizations: decisions, Phase 1 (shipped), Phase 1.5 plan |
| [`docs/AI_PLATFORM_PLAN.md`](AI_PLATFORM_PLAN.md) | AI-first plan: agentic diagnostic, role-based copilot, AI usage metering, knowledge base & docs governance |
| [`docs/VISION.md`](VISION.md) | Product purpose, target audience, and north star |
| [`docs/GOOGLE_OAUTH_SUBMISSION.md`](GOOGLE_OAUTH_SUBMISSION.md) | Google Cloud Console OAuth verification kit & demo video script |
| [`docs/domains/scheduling.md`](domains/scheduling.md) | Availability algorithm, 14-day projection, conflict detection |
| [`docs/operations/environment-variables.md`](operations/environment-variables.md) | Active environment variables reference across environments |
| [`docs/product/seo.md`](product/seo.md) | Search engine, LLMs/Geo SEO, and image guidelines |

---

## 🗄️ DB audit — 2026-09-17

Triggered by the founder's questions about vector search, an agent, messy
migrations, and Supabase coupling. Full plan and reasoning:
[`docs/domains/organizations.md`](domains/organizations.md) is org-specific;
the broader architecture plan lives in this session's approved plan
(vectors: not yet, pgvector when there's a real trigger; chat agent:
LangChain.js + Groq/Gemini behind a flag, later; Supabase: keep for now,
extract service layers incrementally — see journal entry below).

**Row counts at audit time** (`count(*)` via service-role client, all
public tables): `profiles` 684, `user_roles` 617, `waiting_list` 43,
`user_favorites` 5, `feature_flag_audit_logs` 4, `mentor_availability` 4,
`quiz_responses` 4, `feature_flags` 3, `roles` 3, `appointments` 1,
`conversations` 1, `messages` 1, `organization_members` 1,
`mentor_visibility_settings` 2, `newsletter_subscriptions` 2,
`organizations` 2 — everything else (`admin_actions`, `admin_audit_logs`,
`ai_missing_demands`, `appointment_feedbacks`, `feedback`,
`google_calendar_tokens`, `mentor_suggestions`, `mentor_verification`,
`quiz_mentors`, `validation_requests`, `verification_logs`) was 0.

**Dropped** (migration `20260921000003_drop_dead_objects.sql`) — zero rows
*and* zero references anywhere in `app`/`lib`, confirmed with `git grep`
before touching anything:
- `admin_actions`, `quiz_mentors`, `verification_logs`, `mentor_verification`
- `mentor_suggestions` + its view (`mentor_suggestions_view`) + the 6
  functions that only existed to read/write it
  (`get_mentor_suggestions_stats`, `get_most_active_suggesters`,
  `get_most_suggested_free_topics`, `get_most_suggested_inclusion_tags`,
  `get_most_suggested_knowledge_topics`, `mark_old_suggestions_as_expired`)
- The 8 orphaned v1 organizations functions (`check_organization_quota`,
  `get_mentors_by_organization`, `is_organization_admin`,
  `user_has_partner_access`, `get_expiring_memberships`,
  `expire_pending_invitations`, `get_visible_mentor_ids`,
  `is_mentor_visible_to_user`) — **these had already failed to drop once**:
  migration `20260921000000` guessed a `(uuid)` parameter signature that
  didn't match the real one, so `drop function if exists x(uuid);` silently
  no-op'd. Fixed by using the bare name (`drop function if exists x;`),
  which Postgres resolves without a signature when it's unambiguous.

**Kept despite 0 rows** — real, wired-up features that just haven't been
used yet, not dead code: `ai_missing_demands` (logged by `/api/ai/match`
when no mentor matches), `google_calendar_tokens` (per-mentor OAuth, no
mentor has connected Calendar yet), `feedback` (the `/feedback` page form),
`appointment_feedbacks` (session ratings — only 1 appointment exists so
far).
*(Note: `validation_requests` was kept previously, but as of the Sparkling Hummingbird fix, it is no longer written to during onboarding and is now considered obsolete/dead code, candidate for removal in a future migration).*

**Skipped: migration squash** (90 empty `*_remote_baseline.sql`
placeholders → 1 real baseline). Both `supabase migration squash` and
`supabase db dump` need Docker/Podman locally (`LegacyImagePrepullError`
without it) to spin up a shadow database for the diff — founder declined
to install Docker. No functional impact: the placeholders are empty files
that only exist so `db push` doesn't see remote-only history and refuse to
run; they don't affect the app or the real schema. Purely cosmetic clutter
in `supabase/migrations/`. Revisit if Podman (lighter, same CLI interface)
becomes acceptable, or from a machine that already has a container runtime.

---

## 🧪 Evals — 2026-09-17

Added `evals/` (`npm run eval:match`): 20 real-model test cases for
`lib/services/ai/groq.service.ts`, the AI mentor-matching prompt. Not part
of `npm test` — makes real LLM calls (cost, non-deterministic), so it's a
manual gate before changing the prompt/model, not a CI check. Baseline:
**20/20 (100%), ~2.5s avg latency** against `gpt-4o-mini`. See
`evals/README.md`.

---

## 🏢 Multi-Tenant Phase 1.5 — shipped 2026-09-17

Founder review of Phase 1 caught a real coherence bug before it mattered:
the org-invite/approval emails said "acompanha sua jornada... mentores
dedicados a ela" to *everyone*, including mentors being invited to be an
org's own mentor pool — backwards for that audience. Fixed by deriving a
member's kind (beneficiary vs org mentor) from their existing platform role
(`user_roles`, never a new field) and writing role-aware copy for all three
org emails. Also added `organizations.join_policy` (`open`/`invite_only`,
migration `20260921000004`) so an org can choose whether strangers can
request to join or only accept invites — invite-only orgs get `noindex`
and drop out of `sitemap.xml`.

Extracted the first per-domain service pulled out of a route handler:
`lib/services/organizations/org-dashboard.service.ts` — `/api/org/[id]`
went from inline PostgREST calls to a single `getOrgDashboard()` call.
Small, but it's the pattern the roadmap's item 3 (architecture plan,
2026-09-17) calls for: extract incrementally as each domain gets touched,
rather than a big-bang rewrite.

Full detail: [`domains/organizations.md`](domains/organizations.md) §6.
