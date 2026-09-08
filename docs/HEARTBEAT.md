# 💓 HEARTBEAT — Single Source of Truth

## 📅 Last Updated: 2026-09-08
**Current Status:** Modernização global do Design System de botões concluída (tokens `rounded-xl`, elevação tátil `active:scale-[0.98]`, sombras da marca e remoção de ícones decorativos redundantes), tela de Login alinhada ao acabamento de alto nível da tela de Signup, Google OAuth Verification submetido e suíte de testes 100% íntegra.

---

## 🚦 System Health
- **TypeScript:** 0 errors (`npx tsc --noEmit`)
- **Unit Tests:** 73/73 passed across 12 test suites (`npm test`)
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
- **Reference:** See [`docs/SCHEDULING_AND_AVAILABILITY.md`](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/menvo/docs/SCHEDULING_AND_AVAILABILITY.md) and [`docs/GOOGLE_CALENDAR.md`](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/menvo/docs/GOOGLE_CALENDAR.md).

### 4. Database Portability (BFF Architecture)
- **Rule:** UI components must never query Supabase directly.
- **Direction:** All client mutations and queries must flow through internal Next.js API routes (`/api/...`) to ensure zero-downtime database migration away from Supabase in the future.
- **Auth Session:** Managed via `lib/auth/auth-context.tsx` reading `/api/auth/me` and `/api/profile` (cookie-authenticated).

---

## 🎯 Active Backlog Priorities

| Priority | Item | Status |
|---|---|---|
| **P0** | Google OAuth Verification submission in Google Cloud Console | Submitted (Under Review) |
| **P1** | Button Design System Modernization (Signup standard + Text-Only buttons) | Completed |
| **P1** | Dashboard Simplification (Anti-Overengineering — Core Loop focus) | Completed |
| **P2** | Unified In-App Notifications Hub (Header NotificationBell + Hook) | Completed |
| **P2** | Database Portability (100% decoupling to services/BFF layer) | Completed |
| **P2** | Transactional Email Hardening (Brevo templates, founder signature, Deep Teal CTAs) | Completed |
| **P2** | Cron Job Hardening (07:00 BRT schedule, CRON_SECRET auth, BRT timezone boundaries) | Completed |

---

## 📚 Documentation Index

| File | Purpose |
|---|---|
| [`docs/BACKLOG.md`](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/menvo/docs/BACKLOG.md) | Prioritized product items (P0–P3) |
| [`docs/DATA_FLOW_MAP.md`](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/menvo/docs/DATA_FLOW_MAP.md) | Mapeamento de fluxo de dados, TanStack Query, Services e BFF |
| [`docs/V2_ARCHITECTURE_CLEANUP_MAP.md`](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/menvo/docs/V2_ARCHITECTURE_CLEANUP_MAP.md) | Roadmap de desacoplamento, Zod Schemas e preparação para Agente + MCP |
| [`docs/JOURNAL.md`](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/menvo/docs/JOURNAL.md) | Historical log of architectural decisions & milestones |
| [`docs/VISION.md`](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/menvo/docs/VISION.md) | Product purpose, target audience, and north star |
| [`docs/GOOGLE_OAUTH_SUBMISSION.md`](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/menvo/docs/GOOGLE_OAUTH_SUBMISSION.md) | Google Cloud Console OAuth verification kit & demo video script |
| [`docs/SCHEDULING_AND_AVAILABILITY.md`](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/menvo/docs/SCHEDULING_AND_AVAILABILITY.md) | Availability algorithm, 14-day projection, conflict detection |
| [`docs/EVALUATION_SYSTEM.md`](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/menvo/docs/EVALUATION_SYSTEM.md) | Asymmetric feedback model specification |
| [`docs/GOOGLE_CALENDAR.md`](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/menvo/docs/GOOGLE_CALENDAR.md) | Google Calendar OAuth and Meet generation setup |
| [`docs/ENVIRONMENT_VARIABLES.md`](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/menvo/docs/ENVIRONMENT_VARIABLES.md) | Active environment variables reference across environments |
| [`docs/COOKIE_CONSENT.md`](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/menvo/docs/COOKIE_CONSENT.md) | LGPD / GDPR compliance & Clarity analytics consent |
| [`docs/SEO_GUIDE.md`](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/menvo/docs/SEO_GUIDE.md) | Search engine, LLMs/Geo SEO, and image guidelines |
| `docs/archive/` | Archived obsolete specifications and deprecated features |
