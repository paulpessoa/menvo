# 📓 Architecture & Engineering Journal

> Chronological log of major architectural decisions, milestones, and engineering pivots.

---

## 2026-09-08 — Mentor Availability BFF & Transactional Email Hardening
- **Mentor Availability BFF Route (`/api/mentors/availability`):** Resolved availability slots not displaying on `/dashboard/mentor/availability` by introducing a dedicated BFF Route Handler (GET and POST) with Zod validation (`setAvailabilitySchema`). Replaced client-side anonymous RLS queries with server-authenticated session resolution, enabling robust slot listing, saving, and deletion.
- **Personal Founder Signature (Paul Pessoa):** Implemented warm, clean email signature for community and relationship touchpoints (`sendVerificationNotification`, `sendAppointmentConfirmation`, `sendFeedbackRequest`). Includes circular portrait (`public/images/paul-pessoa.jpg`), official WhatsApp icon with direct chat link, and clean text links for LinkedIn/GitHub. Removed decorative emojis across all email templates and titles for a sober, professional tone.
- **Brand Color Harmonization in Emails:** Enforced `#007585` (Deep Teal Menvo) across all Brevo email templates, eradicating rogue `#4F46E5` indigo buttons on Google Meet CTAs.
- **Active Cancellation Emails:** Connected `sendAppointmentCancellation` to `/api/appointments/cancel`, notifying the counterpart (mentor or mentee) with the session date, person who cancelled, and user-provided reason.
- **Streamlined Operational Emails (No Redundant Team Signature):** Eliminated the redundant `Equipe Menvo` signature block from transactional notices (reminders, cancellations). Operational emails now flow directly into the institutional Menvo footer without extra visual noise.

---

## 2026-09-07 — Brand Color Standardization, Scheduling Hardening & Core Loop Polish
- **Official Brand Color (#007585):** Harmonized all buttons, cards, and interactive elements across the platform to Menvo's official deep teal (`#007585` / `--primary: 187 100% 26%`), eliminating arbitrary grass green (`emerald-600`) and legacy indigo/purple accents.
- **Hero Banner Restoration:** Reinstated the top hero banner in `/mentorship/mentee` using the official brand gradient (`from-primary-700 via-primary-600 to-primary`) with functional 1-click CTAs ("Explorar Mentores" and "Explorar Comunidade").
- **Asymmetric Evaluation Model Enforced:** Restricted public star rating and testimonial submission exclusively to mentees evaluating mentors; prevented mentors from receiving confusing review modals about themselves.
- **Scheduling Flow Hardening:** Fixed timezone ISO normalization in `/api/appointments/schedule` (handling `requestedDate` + `requestedStartTime` with `-03:00` offset) and added mentor verification status guards.
- **Auth Context API Decoupling:** Replaced direct database queries in `auth-context.tsx` with `/api/auth/me` and `/api/profile`, eradicated fragile `localStorage` role caching, and fixed logout state resets.

---

## 2026-09-06 — Auth Ecosystem Simplification, Availability Engine & Mobile UX
- **Minute-Based Availability Engine:** Migrated from brittle hour loops to minute-based generator with 45-minute step calculation, minimum duration validation, and safe string guards across scheduling modals.
- **Google Calendar Conflict Detection:** Integrated Google Calendar `freebusy.query` in `/api/appointments/availability` to dynamically suppress colliding slots.
- **Auth Flow Restructuring:** Consolidated password update flows, fixed redirect ping-pong with `@/i18n/routing`, unified confirmation resend, and removed insecure dead endpoints in `/api/auth/`.
- **Mobile Catalog Search:** Redesigned responsive filters sheet, balanced 50/50 action grid, and dismissible active filter chips bar for mobile viewports.

---

## 2026-09-05 — Comprehensive Modernization, Decoupling & LLM SEO
- **Architectural Decoupling:** Enforced strict separation of concerns per `AGENTS.md`. Eliminated all raw Supabase queries in components (`WaitingList`, `FeedbackManagement`, `mentors/page.tsx`), delegating all database interactions to dedicated services (`mentorService`, `mentorshipService`, `waitingListService`).
- **Geo SEO & LLMs Indexing:** Standardized `public/llms.txt`, `public/llms-full.txt`, and AI crawler whitelisting in `robots.txt` for ChatGPT, Perplexity, Claude, Gemini, Kimi, and Manus.
- **Web Quality & Accessibility:** Added font display swap for Inter, Schema.org JSON-LD graph (Organization, WebSite, SearchAction), accessibility skip-to-content links, and Hero image LCP preloading.
- **Strict Typing:** Achieved 100% clean `tsc --noEmit` validation (0 errors across the entire codebase).
- **Docs Consolidation:** Pruned obsolete scratch files and consolidated fragmented documentation into canonical files (`GOOGLE_CALENDAR.md`, `SEO_GUIDE.md`, `COOKIE_CONSENT.md`, `BACKLOG.md`, `product/VISION.md`).

---

## Earlier Milestones
- **Organization Module Deprecation:** Removed multi-tenant organizations in favor of a lean, direct mentor-to-mentee relationship.
- **Unified Internationalization:** Integrated quiz translations into standard Next-intl `messages/{locale}.json` dictionaries.
- **AI Mentorship Matching:** Implemented GPT-4o-mini powered mentor recommendation engine with deterministic fallback in `/api/ai/match`.
