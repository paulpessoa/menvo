# 📋 Menvo Product Backlog

> **Prioritized items** (P0 = Critical / Blockers, P1 = High, P2 = Medium, P3 = Future Enhancements).

---

## 🟠 P1 — High Priority
- [x] **Mentor Search & Filtering Polish:** Redesigned responsive mobile layout for Magic Search, 50/50 action grid, sticky full-height filter drawer, and active chips bar.
- [x] **Mentee Activation:** Track quiz completion to first booked session funnel in Google Analytics.
- [x] **Session Feedback Loop:** Integrated pending evaluations detection, enabled evaluations for both mentors and mentees on completed sessions, and added prominent dashboard notification banner.
- [x] **Auth Context & Role Decoupling:** Migrated profile and role resolution to `/api/auth/me` and `/api/profile`, removed fragile `localStorage` role caching, and fixed logout state resets.
- [x] **Dashboard Simplification (Anti-Overengineering):** Streamline Mentor and Mentee dashboards to focus exclusively on pending booking requests, upcoming confirmed sessions (with Google Meet links), and availability management.

---

## 🟡 P2 — Medium Priority
- [x] **Profile & Calendar Sync Polish:** Enhance Google Calendar conflict detection for mentors with fluctuating availability.
- [x] **Unified In-App Notifications Hub (Bell Icon):** Implemented in-app notification center via `NotificationBell`, `useNotifications`, and `notificationsService`. Displays real-time badge counter, popover with contextual icons (booking requests, confirmations, cancellations, pending evaluations), mark-as-read, and 1-click action navigation.
- [x] **Database Portability & BFF Layer:** Audited and decoupled 100% of frontend components and hooks to flow through services/BFF endpoints.
- [x] **Transactional Email Hardening:** Ensure booking notifications, founder signatures, brand Deep Teal CTAs, and cancellation notices arrive reliably via Brevo SMTP API.
- [x] **Brand Color & Hero Banner Harmonization:** Aligned buttons, cards, and hero banner on `/mentorship/mentee` with Menvo's official deep teal brand palette (`#006276` / `#0f7185` / `--primary`), eliminating off-brand grass green (`emerald-600`) and restoring functional hero actions.
- [x] **Evaluation Flow Distinction (Mentee -> Mentor Only):** Restricted public session evaluation modals exclusively to mentees, preventing mentors from receiving confusing review modals about themselves.
- [x] **Admin Breadcrumb Unification & `/mentors/undefined` Fix:** Unified `AdminBreadcrumb` across all `/dashboard/admin/*` pages with a corrected route map, and guarded two mentor-profile links against missing slug/id (found live via Clarity analytics).
---

## 🔵 P3 — Future / Strategic
- [ ] **Multi-Tenant for Partner Organizations:** Offer Menvo as infrastructure for NGOs/institutions (Instituto Gira, Porto Social, hackathons, SEBRAE) to register their own beneficiaries and tap into the mentor pool. See [`docs/MULTI_TENANT_ROADMAP.md`](MULTI_TENANT_ROADMAP.md) — blocked on a scoping call with a first pilot partner and a live DB check for leftover `organizations` schema from the previously-removed v1.
- [ ] **UI Width/Container Standardization:** Introduce a shared `PageContainer` component and migrate the 5 divergent container conventions found across the app, starting with `/dashboard/admin/*`. See [`docs/UI_CONSISTENCY_AUDIT.md`](UI_CONSISTENCY_AUDIT.md) — needs a founder design call on which convention wins before a broad pass.
- [ ] **`/mentors` Dead-Click Investigation:** 123 dead clicks in 3 months, by far the highest of any page — review Clarity session recordings to find the unresponsive element. See [`docs/CLARITY_INSIGHTS.md`](CLARITY_INSIGHTS.md).
