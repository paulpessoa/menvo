# 💓 STATUS — Single Source of Truth

> Merges what used to be three overlapping files (`HEARTBEAT.md`, `BACKLOG.md`,
> `JOURNAL.md`) into one: current health, standing product/architecture
> invariants, the active backlog, and a chronological engineering log.

## 📅 Last Updated: 2026-09-23
**Current status:** Multi-tenant Phase 1 shipped and merged (organizations,
invite/request/approve membership, org admin dashboard). Phase 1.5
(role-aware reporting, public/invite-only orgs, coherent emails, SEO) is
planned in [`MULTI_TENANT_ROADMAP.md`](MULTI_TENANT_ROADMAP.md) §6, not
started.

---

## 🚦 System Health
- **TypeScript:** 0 errors (`npx tsc --noEmit`)
- **Unit Tests:** 134/134 passed across 27 test suites (`npm test`)
- **Production Build:** 55/55 pages generated successfully (`npm run build`)
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
- **Reference:** See [`docs/SCHEDULING_AND_AVAILABILITY.md`](SCHEDULING_AND_AVAILABILITY.md).

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
- **Reference:** [`docs/MULTI_TENANT_ROADMAP.md`](MULTI_TENANT_ROADMAP.md).

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
- [ ] **Multi-Tenant Phase 1.5:** Role-aware member reporting (beneficiaries vs org mentors), `join_policy` (open/invite-only), coherent per-role emails, sitemap/SEO for org pages. Plan: [`MULTI_TENANT_ROADMAP.md`](MULTI_TENANT_ROADMAP.md) §6.
- [ ] **AI Assistant Phase 2 (Contexto Avançado):** Integrar a verificação de conclusão do `/quiz` ao contexto do agente para que ele possa questionar o usuário sobre insights recebidos ou sugerir ativamente o quiz se a pessoa estiver desorientada e ainda não tiver feito.

---

## 📓 Engineering Journal

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
| [`docs/MULTI_TENANT_ROADMAP.md`](MULTI_TENANT_ROADMAP.md) | Multi-tenant organizations: decisions, Phase 1 (shipped), Phase 1.5 plan |
| [`docs/VISION.md`](VISION.md) | Product purpose, target audience, and north star |
| [`docs/GOOGLE_OAUTH_SUBMISSION.md`](GOOGLE_OAUTH_SUBMISSION.md) | Google Cloud Console OAuth verification kit & demo video script |
| [`docs/SCHEDULING_AND_AVAILABILITY.md`](SCHEDULING_AND_AVAILABILITY.md) | Availability algorithm, 14-day projection, conflict detection |
| [`docs/ENVIRONMENT_VARIABLES.md`](ENVIRONMENT_VARIABLES.md) | Active environment variables reference across environments |
| [`docs/SEO_GUIDE.md`](SEO_GUIDE.md) | Search engine, LLMs/Geo SEO, and image guidelines |

---

## 🗄️ DB audit — 2026-09-17

Triggered by the founder's questions about vector search, an agent, messy
migrations, and Supabase coupling. Full plan and reasoning:
[`docs/MULTI_TENANT_ROADMAP.md`](MULTI_TENANT_ROADMAP.md) is org-specific;
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

Full detail: [`MULTI_TENANT_ROADMAP.md`](MULTI_TENANT_ROADMAP.md) §6.
