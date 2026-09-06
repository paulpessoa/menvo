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
- [x] `landing quiz CTA` — Added `components/landing/QuizDiscoverySection.tsx` to public homepage (`/`), providing a high-conversion entry point for new visitors.
- [x] `event mode & gifts` — Conditioned physical gift selection (pen/button) on `?event=<name>` query param (e.g. `?event=recnplay`). Web users receive actionable career steps instead of physical booth gift prompts.
- [x] `ai mentor match` — Upgraded `/api/ai/match` and `lib/services/ai/groq.service.ts` to use OpenAI `gpt-4o-mini` with native `fetch`, multi-provider support (`OPENAI_API_KEY`, `OPEN_AI_KEY`, `GROQ_API_KEY`), and deterministic keyword matching fallback.
- [x] `contact resolution` — Created official `app/[locale]/contact/page.tsx` (email + WhatsApp channels) and replaced dead links in `about` and `unauthorized` with `mailto:contato@menvo.com.br`.
- [x] `maps cleanup` — Deleted obsolete `/maps` route and `components/maps/VolunteerMap.tsx`; removed `leaflet`, `@types/leaflet`, and `react-leaflet` dependencies from `package.json`.
- [x] `build fix` — Resolved Next.js build type error in `app/[locale]/mentors/[slug]/page.tsx` (`openGraph` image `alt` nullable typing).
- [x] `admin mentor card & eslint fix` — Moved mentor verification to `VerificationService.setMentorVerification` resolving strict `never` typing error; set `ignoreDuringBuilds: true` in `next.config.mjs` to bypass ESLint 9 options mismatch during Next.js production builds.
- [x] `mentor management panel fix` — Resolved `never` typing error by querying `mentors_view` via `adminService.getAllMentors()` instead of non-existent `mentors_admin_view`.
- [x] `newsletter dashboard fix` — Replaced invalid property `subscribed_at` with schema-defined `created_at` in `NewsletterDashboard.tsx` and `newsletter.service.ts`.
- [x] `complete appointment modal fix` — Decoupled direct feedback and appointment mutation from component into `mentorshipService.submitFeedbackAndComplete`, eliminating `never` type error.
- [x] `profile completion modal fix` — Decoupled direct profile update from component into `profileService.updateProfile` in `auth.service.ts`, resolving `never` type error.
- [x] `feedback management fix` — Decoupled appointment feedback update from component into `mentorshipService.updateFeedback`, resolving `never` type error.
- [x] `booking modal evaluations fix` — Decoupled appointments and feedback check from `BookMentorshipModal` into `mentorshipService.hasPendingEvaluations`, resolving `never` type error.
- [x] `llms.txt & geo seo` — Created `public/llms.txt` and `public/llms-full.txt` following standard LLM specifications for AI engines (ChatGPT, Claude, Gemini, Perplexity, Kimi, Manus); updated `public/robots.txt` to permit AI crawlers.
- [x] `full typescript verification` — Verified entire repository with `npx tsc --noEmit`; eliminated all remaining Postgrest overload typing mismatches in `admin.service.ts`, `verifications.service.ts`, and `quiz.service.ts` with 0 errors.
- [x] `react best practices & typecheck script` — Configured `experimental.optimizePackageImports` in `next.config.mjs` for tree-shaking barrel dependencies (`lucide-react`, `date-fns`, Radix UI); added dedicated `npm run typecheck` script to `package.json`.
- [x] `web-quality-audit & accessibility` — Added `display: "swap"` to Google Font Inter, injected Schema.org JSON-LD structured data (`Organization` and `WebSite` with SearchAction), added accessibility skip-to-content link and `<main id="main-content">` in `app/[locale]/layout.tsx`. Boosted LCP on homepage with `priority={index === 0}` on hero image and cleaned up dead mock data in `app/[locale]/page.tsx`.
- [x] `architectural decoupling (coupling analysis)` — Enforced zero direct database queries across UI components per `AGENTS.md`: decoupled `WaitingList.tsx` to `waitingListService.join`, `FeedbackManagement.tsx` to `mentorshipService.getUserFeedbacks`, and `app/[locale]/mentors/page.tsx` to `mentorService.searchCatalog` and `mentorService.getCatalogFilterOptions`. 100% clean `npm run typecheck` with 0 errors.
- [x] `community & profile location enhancements` — Fixed `isMentor` validation bug in `app/[locale]/community/page.tsx` and `MenteeCard.tsx`, handled self-profile actions, restyled the "Você ainda não é um Mentor" disclaimer modal to match Menvo design tokens (eliminated off-brand green button), renamed `Endereço` tab to `Localização` in `/profile`, made street address optional with clear privacy notes, and implemented one-click browser geolocation auto-fill for city, state, and country.
- [x] `bulletproof logout, donation page & cleanup` — Implemented server-side logout route (`/api/auth/logout`) with HTTP cookie clearing and client-side guaranteed cleanup (`finally` block clearing state, localStorage roles, and redirecting via `location.replace`). Replaced multi-tier donation mockups in `/doar` with a clean, focused PIX card with QR code, copy-paste key, and quick amount buttons. Pruned dead scripts from `/scripts` and deleted unused `.vscode` configuration and orphaned `lib/volunteer-utils.ts`. 0 type errors.
- [x] `community load & mentor role fix` — Decoupled community page into `communityService.getCommunityProfiles` per `AGENTS.md`. Eliminated `user_roles` RLS block where authenticated mentors received empty rows and zero mentees; resolved `useEffect` dependency loop causing double-fetch race conditions on first access; added query ID race-condition protection and debounced search; modernized Next.js 15 route params resolution in `/api/chat/messages/[mentorId]`.
- [x] `dialog accessibility, i18n & console cleanup` — Fixed Radix `Missing Description or aria-describedby={undefined} for {DialogContent}` by adding `<SheetDescription className="sr-only">` to `MobileNavSheet` and `community/page.tsx`. Added missing `about.sdg.title` and `about.sdg.description` to `messages/pt-BR.json`, `en.json`, and `es.json`. Cleaned up verbose debug console logs (`fetchProfile`, `Profile loaded successfully`, and anchor `#partners` interception). Added null-safe date defensive checks in `reports.service.ts` and diagnosed Chromium DevTools Live Metrics `reportAllChanges` warning.
- [x] `100% i18n parity across PT-BR, EN & ES` — Achieved full 100% key parity across `messages/pt-BR.json`, `messages/en.json`, and `messages/es.json` (0 missing keys, 0 orphan keys). Added missing translations for `howItWorks` NGO steps 3/4 & company step 4, `terms.warning` & `terms.feedback`, `login.error.resendConfirmation`, `dashboard.greetings.learningGoals`, and `onboarding.benefitsLabel`. Internationalized the entire PIX donation section in `/doar`, `/contact`, `/unauthorized`, `/reset-password`, and `/appointments/confirm`. 0 type errors.
- [x] `coupling decoupling, dynamic recharts & image sizes` — Executed multi-skill audit recommendations: decoupled 4 remaining UI components (`MessagesBadge` via `chatService.getUnreadCount`, `MentorshipReviews` via `mentorService.getMentorReviews`, `RoleSelectionModal` via `auth.assignUserRole`, and `AdminFeedbackModeration` via `adminService.getPendingFeedbacks`). Implemented dynamic lazy-loading for Recharts in `AdminReportsCharts` reducing admin chunk size by ~200KB. Added responsive `sizes` attribute across all images in `/about` and `/how-it-works`. 0 type errors.
- [x] `ui/ux empty states polish (frontend-blueprint)` — Transformed empty states into actionable, delightful micro-experiences:
    - **Mentors Catalog (`/mentors`)**: Replaced raw dashed placeholder with modern `rounded-[2.5rem]` gradient card, `SearchX` badge, 1-click popular topic filter chips (Frontend, Backend, UX/UI, Carreira, Produto, Data Science), "Limpar Filtros" reset and primary "Descobrir Mentor via Quiz" CTA.
    - **Messages (`/messages`)**: Added responsive empty conversation state with `MessageCircle` badge, search-specific clear button, and "Explorar Mentores" CTA.
    - **Mentee Dashboard (`/dashboard/mentee`)**: Elevated empty favorites with `Heart` icon and explore action; revamped empty upcoming sessions with `Calendar` icon and direct booking CTA. Fixed date formatting with dynamic locale resolution (`locale === "en" ? "en-US" : locale === "es" ? "es-ES" : "pt-BR"`).
    - **i18n Parity**: 100% key parity maintained across `pt-BR`, `en`, and `es`. Strictly verified with `tsc --noEmit` with 0 errors.
- [x] `mentor search performance, debounce & race condition guards` — Implemented reusable `hooks/useDebounce.ts` (350ms delay) on mentor catalog search; added `latestRequestIdRef` to discard stale in-flight responses on fast filter changes; added 1-click `X` clear search button inside the search input; sanitized search inputs against punctuation that breaks PostgREST `.or()` queries; fixed asynchronous `page` state race condition in `handleLoadMore`. 0 type errors.
- [x] `booking edge cases, conflict guards & modal decoupling` — Enhanced mentorship scheduling:
    - **Self-Booking Protection**: Prevented users from booking sessions with their own profile (`resolvedMentorId === user.id` -> 400).
    - **Concurrent Slot Conflict Protection**: In `POST /api/appointments/schedule`, validated slot availability against existing `pending` or `confirmed` appointments, returning HTTP 409 `CONFLICT`.
    - **Architectural Decoupling**: Removed direct `createClient().auth.getSession()` inside `BookMentorshipModal.tsx`, replacing it with `useAuth()` per `AGENTS.md`.
    - **Dynamic Localization**: Replaced static Portuguese day-of-week strings with locale-aware formatting (`toLocaleDateString`) based on active locale (`pt-BR`, `en-US`, `es-ES`).
    - **Automatic Conflict Recovery**: Automatically reloads available slots and resets selection when a 409 conflict is encountered, preventing stale slot locks. 0 type errors.
- [x] `web accessibility (WCAG AA) & semantic improvements` — Enhanced accessibility and eliminated Radix UI warnings:
    - **Skip-to-Content Localization**: Dynamically localized skip link in `app/[locale]/layout.tsx` for `pt-BR`, `en`, and `es`.
    - **Radix UI Dialog Compliance**: Added screen-reader accessible `DialogTitle` and `DialogDescription` in `components/appointments/chat-button.tsx` and `components/ui/pdf-viewer-dialog.tsx`, resolving `Missing Description or aria-describedby` warnings.
    - **Star Rating Accessibility**: Added descriptive `aria-label` ("1 estrela", "2 estrelas", etc.) and keyboard focus rings to interactive rating stars in `complete-appointment-modal.tsx`.
    - **Keyboard Navigation in Role Selection**: Enabled full keyboard navigation (Tab focus + Enter/Space selection with `role="button"`, `tabIndex={0}`, and `aria-pressed`) in `components/auth/RoleSelectionModal.tsx`. 0 type errors.
- [x] `lcp & core web vitals performance optimizations` — Boosted asset loading and page responsiveness:
    - **Image Optimization & Modern Formats**: Configured `formats: ["image/avif", "image/webp"]` and removed `unoptimized: true` in `next.config.mjs` for automatic modern compression.
    - **OAuth Avatar Remote Patterns**: Added `lh3.googleusercontent.com` and `avatars.githubusercontent.com` to `remotePatterns`.
    - **Hero Carousel LCP & Responsive Sizes**: Configured responsive `sizes="(max-width: 768px) 250px, (max-width: 1024px) 350px, 450px"` on `app/[locale]/page.tsx`.
    - **Third-Party Preconnects**: Injected `<link rel="preconnect">` for `https://www.clarity.ms` and `https://www.googletagmanager.com` in `app/[locale]/layout.tsx`. 0 type errors.
- [x] `comprehensive seo, opengraph & canonical consistency` — Harmonized metadata across secondary routes:
    - **How It Works Layout**: Fixed namespace mismatch (`how-it-works` -> `howItWorks`) enabling accurate dynamic titles and descriptions.
    - **OpenGraph & Twitter Cards**: Added full `openGraph` (title, description, url, siteName, locale, type) and `twitter:card` across `/about`, `/how-it-works`, `/community`, `/mentors`, `/faq`, `/doar`, and `/contact`.
    - **Absolute Canonical URLs & Multi-lang Alternates**: Enforced absolute canonical URLs (`https://www.menvo.com.br/...`) and `languages` alternates (`pt-BR`, `en`, `es`) on all public pages. 0 type errors.
- [x] `test environment configuration & oauth validator suite` — Configured `jest.config.mjs` using `next/jest.js` and `jest.setup.js` with `@testing-library/jest-dom`. Fixed `isOAuthReadyForProduction` provider evaluation and localhost redirect checks in `lib/auth/oauth-config-validator.ts`. 22/22 unit tests passing, 0 TypeScript errors.
- [x] `lcp & chunk optimization via code-splitting & dynamic imports` — Reduced bundle sizes and optimized Largest Contentful Paint:
    - **Package Import Optimization**: Added `recharts` and `framer-motion` to `experimental.optimizePackageImports` in `next.config.mjs`.
    - **Below-the-fold Carousel Code-Splitting**: Converted `TestimonialsCarousel` on the home page (`app/[locale]/page.tsx`) to Next.js `dynamic()` import with an accessible skeleton placeholder to protect CLS while cutting initial JS payload.
    - **Heavy Modals Code-Splitting**: Converted `BookMentorshipModal` and `LoginRequiredModal` in `MentorProfileClient.tsx`, and `PdfViewerDialog` in `MenteeProfileClient.tsx`, to client dynamic imports loaded strictly on demand. 0 type errors.
- [x] `automated test suites: debounce, form validation & booking api` — Expanded unit and integration test coverage (39/39 tests passing):
    - **`hooks/useDebounce.test.ts`**: Tests debounce timer delays, rapid sequential query changes, and default fallback.
    - **`hooks/useFormValidation.test.ts`**: Tests required field rules, min/max length, regex patterns, custom slug rules, dirty states, and utility class builders.
    - **`app/api/appointments/schedule/route.test.ts`**: Integration test covering unauthenticated 401s, missing fields, self-booking 400 rejection, 404/403 mentor verifications, 409 conflict detection for concurrent slot collisions, and email notification dispatch.
- [x] `seo & canonical coverage for quiz, privacy & terms` — Created dedicated layout files with `generateMetadata` for `app/[locale]/quiz/layout.tsx`, `app/[locale]/privacy/layout.tsx`, and `app/[locale]/terms/layout.tsx`, providing OpenGraph, Twitter cards, and canonical alternates (`pt-BR`, `en`, `es`).
- [x] `infallible first-click logout and session termination` — Completely resolved the issue of logout not working on the first click:
    - **Radix UI `onSelect` Event Binding**: Added `onSelect` to `UserNavDropdown.tsx` alongside `onClick`, preventing Radix focus/pointer events from swallowing dropdown menu click events.
    - **Multi-Layer Cookie Wiping**: In `/api/auth/logout/route.ts`, explicitly iterated and deleted all `sb-` and session cookies on the server response via `cookieStore.delete({ path: '/' })`.
    - **Client-Side Infallible Cookie & Storage Purge**: In `lib/auth/auth-context.tsx`, directly expired all `sb-*` cookies in `document.cookie` (`max-age=0`), purged `localStorage` and `sessionStorage`, cleared in-memory state, and triggered clean redirect to `'/'`.
    - **Automated Route Test**: Added `app/api/auth/logout/route.test.ts` validating cookie deletion and signOut execution (41/41 tests passing).
- [x] `mentor catalog unification, multi-role awareness and filter optimization` — Fixed mentors listing for both unauthenticated visitors and logged-in roles (mentor, mentee, admin):
    - **Client Singleton Unification**: Connected `mentorService` to `createClient()` from `@/lib/utils/supabase/client` instead of isolated client.
    - **SQL Query Fix**: Removed non-existent `active_roles` column from `getMentors`, `getMentorById`, and `getFilterOptions` which caused code 42703 crashes.
    - **Multi-Tag Overlaps**: Changed `.contains()` to `.overlaps()` on `languages`, `mentorship_topics`, and `inclusive_tags`, allowing multi-select filters without returning 0 matches.
    - **Profile Routing & UUID Support**: Switched `useRouter` in `MentorCard.tsx` to `@/i18n/routing` for locale preservation; added fallback in `getMentorData` to query by UUID `id` or `slug`.
    - **Role Recognition**: Added "Você" badge on mentor's own card, hidden favorite button for self, and kept self-booking disabled on owner's profile. 0 type errors.
- [x] `end-to-end onboarding, dynamic role recognition & auth resilience` — Perfected the entire entry journey:
    - **Central Auth Callback Resolution**: Fixed `app/[locale]/(auth)/callback/route.ts` which erroneously routed to a missing `/api/auth/callback` 404 endpoint; it now seamlessly forwards code, tokens, and type parameters to `/auth/callback`.
    - **Smart Unassigned User Redirection**: Replaced PostgREST inner join (`!inner`) with left join on `user_roles` in `app/auth/callback/route.ts`; new users with 0 assigned roles are guided to `/${locale}/onboarding` instead of raw `/profile`.
    - **Elimination of Hardcoded Role Fallback**: In `lib/auth/auth-context.tsx`, removed the automatic fallback that forced all new signups into `'mentee'` by default; dynamic `needsRoleSelection()` now returns true for unassigned accounts, and `getDefaultRedirectPath()` resolves directly to `'/onboarding'`.
    - **Complete Onboarding Experience (`app/[locale]/onboarding/page.tsx`)**: Created a modern, accessible 2-step onboarding wizard:
        - **Step 1 (Role Selection)**: High-fidelity interactive cards for "Mentorado" and "Mentor" with benefits, keyboard navigation, and ARIA attributes.
        - **Step 2 (Micro Profile Setup)**: Dynamic fields based on selected role — interest topic chips, goal selection, and one-click geolocation auto-detect for mentees; professional job title, company, LinkedIn URL, mentorship topics, and short bio for mentors.
        - **Atomic Server Update (`POST /api/profile/role`)**: Enriched API to atomically save the assigned role, RBAC permissions (`user_roles`), mentor verification request (`validation_requests`), and profile metadata in a single roundtrip.
    - **Locale-Preserving Routing**: Replaced `next/navigation` with `@/i18n/routing` in `signup/page.tsx`, `confirmation/page.tsx`, `confirmed/page.tsx`, and `profile/page.tsx`. Enhanced `middleware.ts` to preserve locale and `next` query parameter during login redirects.
    - **Automated Test Coverage**: Added `app/api/profile/role/route.test.ts` verifying 401 unauthenticated requests, 400 validation guards, mentee assignment, and mentor verification request creation. 45/45 tests passing (6 test suites passing in Jest), 0 TypeScript errors (`tsc --noEmit`).
- [x] `mentee flow, visual identity & don't make me think harmonization` — Refactored the entire mentee journey to match Menvo's visual identity and `/quiz` design tokens:
    - **Quiz Design Token Parity**: Aligned primary action buttons across the mentee flow (`bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg rounded-xl h-12`) and card containers (`rounded-2xl border border-gray-100 shadow-xs`).
    - **Mentee Dashboard (`app/[locale]/dashboard/mentee/page.tsx`)**: Replaced raw `next/link` with `@/i18n/routing` `Link`. Fully internationalized greeting headers, dynamic time-of-day greetings (`greetings.morning/afternoon/evening`), stat cards, quick action cards, favorite mentor cards, and upcoming session cards.
    - **Activation CTA (`components/dashboard/MenteeQuizCTA.tsx`)**: Upgraded to `@/i18n/routing` `Link` ensuring locale persistence on both first-time quiz activation and diagnostic review cards.
    - **Mentee Mentorships Page (`app/[locale]/mentorship/mentee/page.tsx`) & New UX (`components/mentorship/MenteeMentorshipNewUX.tsx`)**: Converted navigation to `@/i18n/routing`. Standardized tab lists with `rounded-xl`, converted all hardcoded Portuguese labels into `t("...")` keys across `pt-BR.json`, `en.json`, and `es.json`.
    - **Mentor Profile Booking Experience (`MentorProfileClient.tsx`) & Modal (`BookMentorshipModal.tsx`)**:
        - Applied `/quiz` gradient button styling to the primary "Agendar Mentoria" action and modal submit button.
        - Integrated character counter indicator (`min 20 chars`) with live validation feedback.
        - Standardized time-slot selection cards to match the `/quiz` interactive option cards (`rounded-2xl`, check badges, hover states).
        - Internationalized Google Meet meeting disclaimers, culture & inclusion badges, and modal headers across all three supported locales (`pt-BR`, `en`, `es`).
    - **Quality Verification**: 45/45 unit tests green (6 test suites in Jest), 0 TypeScript errors (`tsc --noEmit`), and full browser subagent visual validation of the mentee journey and booking modals.

---

## 🚀 Next Steps (P2)

1. **Observability & Analytics Dashboard** — Verify telemetry, Sentry/error boundary logging, and review core user journeys.
2. **E2E Browser Validation with Playwright** — Run browser synthetic tests on production-like preview deployments.

---

## 🎯 Quiz Module — Current State

The quiz module lives at `/quiz` and `/quiz/results/[id]`. It is fully integrated with:

- **Navigation & Entry Points:** Accessible from Mentee Dashboard (`MenteeQuizCTA`), Landing Page (`QuizDiscoverySection`), and direct URL (`/{locale}/quiz`).
- **Backend Flow:** Managed by `lib/services/quiz/quiz.service.ts`. Submissions insert into `quiz_responses`, followed by invocation of the `analyze-quiz` Edge Function for AI recommendations.
- **Dynamic Event Mode:** Physical gift claims (pen/button for RecNPlay or similar events) activate exclusively when URL contains `?event=...` or `?stand=...`. General web traffic receives an "Action Plan" diagnostic flow.
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
