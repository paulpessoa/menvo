# 🗺️ Menvo Platform Architecture (2026)

This document lists all available pages, categorized by access level and operational status.

## 🔓 Public Pages (Accessible to everyone)
| Page Path | Purpose | Status |
| :--- | :--- | :--- |
| `/` | Landing page and main entry point. | ✅ Fully Functional |
| `/about` | Our mission, vision, and team. | ✅ Fully Functional |
| `/how-it-works` | Step-by-step guide for mentors/mentees. | ✅ Fully Functional |
| `/mentors` | Public feed of available mentors. | ✅ Fully Functional |
| `/community` | Public board of members offering/seeking help. | ✅ Fully Functional |
| `/hub` | Resources, affiliate links, and materials. | ✅ Fully Functional |
| `/organizations` | List of partner organizations/NGOs. | ✅ Fully Functional |
| `/faq` | Frequently Asked Questions. | ✅ Fully Functional |
| `/privacy` | Privacy Policy and GDPR compliance. | ✅ Operational |
| `/terms` | Terms of Service and Use. | ✅ Operational |

## 🔐 Auth Pages (Authentication flow)
| Page Path | Purpose | Status |
| :--- | :--- | :--- |
| `/login` | User sign-in (Email, Google, LinkedIn). | ✅ Highly Stable |
| `/signup` | User registration and initial onboarding. | ✅ Fully Functional |
| `/forgot-password` | Password recovery request. | ✅ Fully Functional |
| `/update-password` | Final password change (after email link). | ✅ Fully Functional |
| `/select-role` | Post-signup role selection (Mentor/Mentee). | ✅ Fully Functional |
| `/auth/callback` | Technical master route for OAuth/Magic links. | ✅ Isolated & Stable |
| `/resend-confirmation` | Page to request a new confirmation email. | ✅ Fully Functional |

## 🛡️ Protected Pages (Authenticated users only)
| Page Path | Purpose | Status |
| :--- | :--- | :--- |
| `/dashboard` | Main hub (auto-redirects to Mentor or Mentee). | ✅ Fully Functional |
| `/dashboard/mentor` | Specific metrics and tools for Mentors. | ✅ Fully Functional |
| `/dashboard/mentee` | Booking and progress tracking for Mentees. | ✅ Fully Functional |
| `/profile` | Full profile management (Auto-save enabled). | ✅ Highly Functional |
| `/messages` | Real-time chat system with mentors. | ✅ Operational |
| `/settings` | Global account and security configurations. | ✅ Stable |
| `/calendar` | Integration with Google Calendar. | 🛠️ Needs Verification |
| `/organizations/new` | Form to register a new partner organization. | ✅ Fully Functional |

## 👑 Admin Pages (Staff members only)
| Page Path | Purpose | Status |
| :--- | :--- | :--- |
| `/admin` | Main administrative overview. | ✅ Fully Functional |
| `/admin/users` | User management and growth metrics. | ✅ Highly Functional |
| `/admin/hub` | Moderation of resources and affiliate links. | ✅ Fully Functional |
| `/admin/feedbacks` | Voice of the community (Feedback review). | ✅ Fully Functional |
| `/admin/mentors/verify`| Verification of new mentor applications. | ✅ Operational |

---

## 🧹 Removed/Obsolete Routes
| Page Path | Reason for Removal | Replacement |
| :--- | :--- | :--- |
| `/events` | Redundant content. | Integrated into `/hub` |
| `/auth/reset-password`| Unified with `/forgot-password`. | `/forgot-password` |
| `/auth/set-password` | Duplicated logic. | `/update-password` |
| `/verifications` | Legacy OTP code flow. | `/api/auth/callback` (Link) |
| `/test-*` | Development diagnostic tools. | Removed for Production |
| `/get-refresh-token` | Technical debug page. | Handled by Middleware |
