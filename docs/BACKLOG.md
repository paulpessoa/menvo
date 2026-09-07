# 📋 Menvo Product Backlog

> **Prioritized items** (P0 = Critical / Blockers, P1 = High, P2 = Medium, P3 = Future Enhancements).

---

## 🔴 P0 — Critical (Immediate)
- [ ] **Google OAuth Verification Submission:** Complete demo recording showing the end-to-end booking flow and submit the verification request in Google Cloud Console.

---

## 🟠 P1 — High Priority
- [x] **Mentor Search & Filtering Polish:** Redesigned responsive mobile layout for Magic Search, 50/50 action grid, sticky full-height filter drawer, and active chips bar.
- [x] **Mentee Activation:** Track quiz completion to first booked session funnel in Google Analytics.
- [x] **Session Feedback Loop:** Integrated pending evaluations detection, enabled evaluations for both mentors and mentees on completed sessions, and added prominent dashboard notification banner.
- [x] **Auth Context & Role Decoupling:** Migrated profile and role resolution to `/api/auth/me` and `/api/profile`, removed fragile `localStorage` role caching, and fixed logout state resets.
- [ ] **Dashboard Simplification (Anti-Overengineering):** Streamline Mentor and Mentee dashboards to focus exclusively on pending booking requests, upcoming confirmed sessions (with Google Meet links), and availability management.

---

## 🟡 P2 — Medium Priority
- [x] **Profile & Calendar Sync Polish:** Enhance Google Calendar conflict detection for mentors with fluctuating availability.
- [ ] **Unified In-App Notifications Hub (Bell Icon):** Dedicated `notifications` table (`id`, `user_id`, `type`, `title`, `message`, `action_url`, `is_read`, `read_at`, `deleted_at`). Header bell icon with unread badge counter, dropdown drawer linking directly to actions needing attention (new booking requests, confirmed sessions, pending evaluations), with mark-as-read and soft-delete support.
- [ ] **Database Portability & BFF Layer:** Audit all remaining frontend components to ensure 100% of data mutations flow through `/api/...` endpoints, preparing for future database migration away from Supabase.
- [ ] **Transactional Email Hardening:** Ensure booking notifications and reminders arrive reliably via email (reducing MVP dependence on in-app real-time chat).
- [x] **Brand Color & Hero Banner Harmonization:** Aligned buttons, cards, and hero banner on `/mentorship/mentee` with Menvo's official deep teal brand palette (`#006276` / `#0f7185` / `--primary`), eliminating off-brand grass green (`emerald-600`) and restoring functional hero actions.
- [x] **Evaluation Flow Distinction (Mentee -> Mentor Only):** Restricted public session evaluation modals exclusively to mentees, preventing mentors from receiving confusing review modals about themselves.
---
