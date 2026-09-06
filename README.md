<p align="center">
  <a href="https://www.menvo.com.br/">
    <img 
      src="https://raw.githubusercontent.com/paulpessoa/menvo/main/public/images/logo512.png"
      alt="Menvo Logo" 
      width="110" 
      height="110"
    />
  </a>
</p>

<h1 align="center">Menvo — Mentoria Voluntária</h1>

<p align="center">
  <strong>Democratizing career mentorship for youth and students seeking their first professional opportunities.</strong>
</p>

<p align="center">
  <a href="https://www.menvo.com.br/">Website</a> •
  <a href="https://www.menvo.com.br/about">About</a> •
  <a href="https://www.menvo.com.br/mentors">Find Mentors</a> •
  <a href="https://www.menvo.com.br/doar">Donate (PIX)</a> •
  <a href="https://www.menvo.com.br/contact">Contact</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.2-black?style=flat-square&logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=flat-square&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/TanStack_Query-v5-FF4154?style=flat-square&logo=react-query" alt="TanStack Query" />
  <img src="https://img.shields.io/badge/i18n-PT--BR%20%7C%20EN%20%7C%20ES-orange?style=flat-square" alt="i18n" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License MIT" />
</p>

---

## 📖 About Menvo

**Menvo** is an open-source, non-profit platform that bridges experienced professionals with young people entering the workforce. Through 1-on-1 volunteer mentorship sessions, guided career quizzes, and community networking, we empower underrepresented talent with the knowledge, confidence, and tools to succeed.

Aligned with the **United Nations Sustainable Development Goals (SDGs 4, 8, and 10)**, Menvo provides 100% free, high-impact mentorship to students and career changers across Brazil and internationally.

---

## ✨ Key Features

- 🎯 **AI Mentor Match:** Instant recommendation of mentors matching the mentee's career goals using OpenAI and Groq-powered embeddings.
- 📅 **Integrated Scheduling:** Calendar availability, Google Calendar event synchronization, and instant email confirmation.
- 💬 **Real-Time Messaging:** Secure mobile-responsive chat for mentors and mentees before and after sessions.
- 🧭 **Career Discovery Quiz:** Interactive onboarding quiz diagnosing career goals and directing mentees to tailored tracks.
- 🌐 **Full Internationalization (i18n):** Native multi-language support in **Portuguese (pt-BR)**, **English (en)**, and **Spanish (es)** via `next-intl`.
- 👥 **Community Hub:** Public feed connecting mentors, mentees, and organizations with geolocation auto-fill.
- 🛡️ **Mentor Verification:** Multi-step vetting process ensuring a safe, trusted, and high-quality environment.
- 💝 **Transparent Volunteer Support:** Built-in zero-fee PIX donation system directly funding server infrastructure.

---

## 🛠️ Tech Stack

| Domain | Technology | Purpose |
|---|---|---|
| **Framework** | [Next.js 15 (App Router)](https://nextjs.org/) | Hybrid Server & Client architecture, streaming, Route Handlers |
| **Language** | [TypeScript 5.9](https://www.typescriptlang.org/) | Strict static typing, 0 `any` boundary enforcement |
| **Frontend UI** | [React 19](https://react.dev/) + [Radix UI](https://www.radix-ui.com/) | Accessible, composable, headless primitives |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Responsive design, design tokens, sleek dark/light system |
| **Backend & Auth** | [Supabase](https://supabase.com/) | PostgreSQL, Row Level Security (RLS), Realtime, Auth, Storage |
| **Server State** | [TanStack Query v5](https://tanstack.com/query) | Cache synchronization, optimistic updates, request deduplication |
| **Client State** | [Zustand](https://zustand-demo.pmnd.rs/) | Minimalist, unopinionated global client state |
| **Forms & Validation** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Strict schema validation at all external data boundaries |
| **Internationalization** | [next-intl](https://next-intl-docs.vercel.app/) | Type-safe translations across `pt-BR`, `en`, and `es` |
| **AI Integration** | OpenAI / Groq API | Semantic keyword & prompt-based mentor matching |
| **Email Service** | [Brevo (Sendinblue)](https://www.brevo.com/) | Transactional emails (confirmations, scheduling, alerts) |
| **Hosting & Edge** | [Vercel](https://vercel.com/) | Global Edge Network deployment and preview environments |

---

## 📁 Repository Structure

```text
menvo/
├── app/
│   ├── [locale]/             # Localized routes (pt-BR, en, es)
│   │   ├── (auth)/           # Login, register, password recovery
│   │   ├── about/            # Mission, SDG commitments, and team
│   │   ├── appointments/     # Booking, scheduling, and confirmation
│   │   ├── community/        # Community members board
│   │   ├── contact/          # Official channels & WhatsApp support
│   │   ├── dashboard/        # Mentee & Mentor personalized hubs
│   │   │   └── admin/        # Admin management (users, reports, flags)
│   │   ├── doar/             # Volunteer donations via PIX
│   │   ├── how-it-works/     # Guides for mentees, mentors, NGOs, companies
│   │   ├── mentors/          # Public mentor directory & profiles
│   │   ├── messages/         # Real-time chat interface
│   │   ├── profile/          # Profile management & geolocation settings
│   │   ├── quiz/             # Career onboarding discovery quiz
│   │   └── settings/         # Account & notification preferences
│   └── api/                  # Backend Route Handlers (auth, appointments, AI)
├── components/               # Modular UI components
│   ├── admin/                # Admin panels & metrics
│   ├── appointments/         # Scheduling cards, modals & calendars
│   ├── auth/                 # Sign-in & register forms
│   ├── chat/                 # Real-time messaging components
│   ├── dashboard/            # Dashboard widgets & action cards
│   ├── header/               # Responsive navigation & language selector
│   ├── landing/              # Hero, stats, testimonials, and quiz CTA
│   ├── mentors/              # Mentor cards, search & filter drawers
│   └── ui/                   # Reusable Shadcn / Radix UI primitives
├── docs/                     # Documentation (Heartbeat, Backlog, Guides)
├── hooks/                    # Reusable React hooks
├── lib/                      # Core utilities and business services
│   ├── services/             # Dedicated Supabase services (mentors, admin, etc.)
│   ├── types/                # Database & TypeScript schema definitions
│   └── utils/                # Date formatting, Supabase client helpers
├── messages/                 # Translation dictionaries (pt-BR.json, en.json, es.json)
└── public/                   # Static assets, logos, and SEO files (robots.txt, llms.txt)
```

---

## 🗺️ Route Architecture

### 🔓 Public Pages
- `/` — Homepage with interactive hero, testimonials, and quiz activation CTA.
- `/about` — Platform mission, SDG commitments, and volunteer team.
- `/mentors` — Public directory of verified mentors with category and skill filters.
- `/how-it-works` — Comprehensive guides for mentees, mentors, NGOs, and companies.
- `/community` — Community discovery board for members offering and seeking guidance.
- `/doar` — Direct zero-fee PIX donation card to support platform servers.
- `/contact` — Official contact channels (Email & WhatsApp support).
- `/quiz` — Career diagnostic onboarding flow with personalized recommendations.
- `/privacy` & `/terms` — Privacy Policy (LGPD compliant) and Terms of Service.

### 🔐 Authentication Flow
- `/login` — User authentication (Email + Password, Google OAuth, LinkedIn).
- `/signup` — Registration with role selection (`mentee` or `mentor`).
- `/reset-password` — Secure password recovery.
- `/confirm-email` — Verification link & 6-digit OTP code confirmation.

### 🛡️ Protected Pages (Authenticated Users)
- `/dashboard` — Unified dashboard with dynamic views for Mentees and Mentors.
- `/profile` — Profile editor with optional street privacy and 1-click geolocation.
- `/messages` — Real-time direct chat between matched pairs.
- `/mentorship/mentor` & `/mentorship/mentee` — Session history, reviews, and Google Meet access.
- `/settings` — Account security, notifications, and language preferences.

### 👑 Admin Management
- `/dashboard/admin` — Central platform overview and operational KPIs.
- `/dashboard/admin/users` — User management and role administration.
- `/dashboard/admin/reports` — Community metrics, session completion rates, and evaluations.
- `/dashboard/admin/feature-flags` — Dynamic feature flag toggles.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.18.0` or later (LTS recommended)
- **Package Manager**: `npm` (comes with Node.js)
- **Supabase Account**: A free Supabase project with PostgreSQL database

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/paulpessoa/menvo.git
   cd menvo
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file and fill in your Supabase credentials:
   ```bash
   cp .env.example .env.local
   ```
   Required keys in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Command | Action |
|---|---|
| `npm run dev` | Starts the Next.js development server with hot-reloading |
| `npm run build` | Compiles the production build |
| `npm run start` | Runs the compiled production server |
| `npm run typecheck` | Validates full codebase static typing with `tsc --noEmit` |
| `npm run lint` | Lints files using Next.js ESLint configuration |
| `npm test` | Runs test suites with Jest |
| `npm run db:types` | Generates TypeScript definitions directly from Supabase schema |

---

## 🏛️ Architectural Standards

Contributions must adhere to the constraints defined in `AGENTS.md`:

1. **Clean Separation:** Database operations must always reside in `lib/services/` or Server Actions. UI components must never query Supabase directly.
2. **React Server Components by Default:** Minimize `"use client"` directives to reduce client-side JavaScript bundle size.
3. **Security & RLS First:** All data access must respect Row Level Security (RLS). Never expose `service_role` to client code.
4. **Strict TypeScript:** No `any`. Use Zod schemas for all external boundaries (APIs, forms, URL parameters).
5. **No N+1 Queries:** Join related entities in single queries (`select('*, profiles(*)')`).

---

## 🤝 Contributing

We welcome contributions of all kinds: bug fixes, new features, translation improvements, and documentation polish!

Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines on branching, Conventional Commits, and pull request processes.

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).

---

## 📞 Official Channels & Community

- **Official Website:** [https://www.menvo.com.br](https://www.menvo.com.br)
- **Support Email:** [contato@menvo.com.br](mailto:contato@menvo.com.br)
- **WhatsApp Support:** [+55 (81) 99509-7377](https://wa.me/5581995097377)
- **LinkedIn:** [Menvo on LinkedIn](https://www.linkedin.com/company/menvo/)
- **Instagram:** [@menvobr](https://www.instagram.com/menvobr/)

<p align="center">
  Made with 💚 by the Menvo community.
</p>
