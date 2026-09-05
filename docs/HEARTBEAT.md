# 💓 HEARTBEAT — Single Source of Truth

## 📅 Last Updated: 2026-09-05
**Current Status:** Codebase refactoring completed across hooks, services, API routes, components, and pages. Obsolete docs archived.

---

## 📍 Where We Left Off

### Completed Refactoring (this session)
1. **Hooks (`hooks/`)** — Renamed `use-feedback.ts` → `useFeedback.ts`, removed orphaned `useProfiles.ts`. `useFavorites.ts` migrated to TanStack Query (N+1 queries eliminated).
2. **Services (`lib/services/`)** — Enforced strict Supabase typing across `admin`, `verifications`, `mentors`, and `mentorship` services. Removed loose `as any` casts and typed all queries against the remote database schema.
3. **API Routes (`app/api/`)** — Enforced Zod schemas on `POST /api/feedback`, `POST /api/appointments`, and user profile updates. Strict input validation across endpoints.
4. **Components (`components/`)** — Removed loose `as any` casts across `admin/`, `appointments/`, `auth/`, `dashboard/`, `mentors/`, and `LanguageSelector`. Modularized `QuizForm` with step subcomponents and Zod validation. Decoupled `Header` and `AppointmentCard`.
5. **Pages (`app/[locale]/`)** — Decoupled direct database queries in `appointments/book/[mentorId]` into `mentorService`. Cleaned up typing in `community`, `mentee/[slug]`, `mentors/[slug]`, `messages`, `quiz`, `quiz/results`, and `settings`.
6. **Documentation & Cleanup (`docs/`)** — Archived stale documentation and loose non-app files (`PROJECT_ANALYSIS.md`, `PROGRESS_SUMMARY.md`, `clarity-page.tsx`, `quiz-flow-page.tsx`, `implementation-plan.html`) into `docs/archive/`.
7. **Agent Config** — Consolidated `.agents/` into `.agent/`. Rewrote `AGENTS.md` entirely in English without personal exposure.
8. **Internationalization (i18n)** — Merged quiz translations into `messages/{locale}.json`. Exported and strictly typed the `Locale` type across routing.

### Remaining Refactoring Targets
- [x] `events` — Audited; removed orphaned legacy events components and model (`components/events/`, `lib/types/models/event.ts`). External channels (LinkedIn/Instagram) preferred.
- [x] `chat mobile` — Hardened mobile real-time chat with visibility resume, silent refresh, and fallback polling (`components/chat/ChatInterface.tsx`).
- [x] `quiz onboarding` — Integrated into Mentee Dashboard as primary activation CTA. Created `lib/services/quiz/quiz.service.ts`, `components/dashboard/MenteeQuizCTA.tsx`, prefilled auth user details, and added i18n keys across pt-BR, en, and es.

---

## 🚀 Next Steps (P1)

1. **Landing Page Quiz CTA** — Add a dedicated discovery section/banner on the public landing page (`app/[locale]/page.tsx`) linking prospective mentees to `/quiz`.
2. **Event Mode / QR Code** — Configurable query param (e.g. `?event=recnplay` or `?event=community`) to show/hide gift selection for in-person events without polluting general onboarding.

---

## 🎯 Quiz Module — Current State

The quiz module lives at `/quiz` and `/quiz/results/[id]`. It is a **standalone, publicly accessible flow** with no login requirement:

- **Navigation:** No links currently point to it from the header, footer, sidebar, or dashboard. It is accessible solely via direct URL (`/{locale}/quiz`).
- **Backend Flow:** Submissions are inserted directly into `quiz_responses`, followed by invocation of the `analyze-quiz` Edge Function for AI recommendations. The results page polls until `processed_at` is set.
- **Edge Functions:** `analyze-quiz` (AI analysis) and `send-quiz-email` (results delivery).
- **In-Person Event Flow:** Results offer physical gift selection (pen or button) designed for the **RecNPlay 2025 event in Recife**.
- **Social Sharing:** WhatsApp and LinkedIn share buttons integrated on results.

---

## 🗄️ Database Workflow — Mandatory Rule

> ⚠️ Whenever you add, change, or remove tables/columns/views/functions in Supabase, always run:

```bash
npm run db:types
```

This regenerates `lib/types/supabase.ts` from the remote schema, ensuring end-to-end type safety.

> ⚠️ **On Windows/PowerShell**, the `>` operator generates UTF-16. Always use `npm run db:types` which handles encoding. If running manually:
> ```powershell
> supabase gen types typescript --project-id evxrzmzkghshjmmyegxu --schema public | Out-File -Encoding UTF8 lib/types/supabase.ts
> ```

**Supabase project:** `Menvo` — ref: `evxrzmzkghshjmmyegxu` (East US / North Virginia)

---

## 🛠️ Technical Notes
- **Routing:** Dashboard access unified via `/dashboard` for all roles. Middleware handles destination.
- **API Admin:** Route `/api/admin/organizations/[id]/status` manages state transitions with approval tracking.
- **i18n:** Keys `magicSearch` and `admin.feedbacks` integrated for translation parity.
- **TypeScript:** Strict type checks applied across all layers; direct `as any` casting has been eradicated from active components, pages, and services.
