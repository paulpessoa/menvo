# Contributing to Menvo 🤝

Thank you for your interest in contributing to **Menvo**! We are a community-driven, non-profit platform dedicated to democratizing voluntary career mentorship for young students and early-career professionals.

To ensure consistency, security, and high engineering standards across our codebase, please review the guidelines below before submitting a Pull Request.

---

## 🚀 Quick Workflow

1. **Fork** the repository and clone your fork locally.
2. Create a new topic branch:
   ```bash
   git checkout -b feat/your-feature-name
   # or fix/your-bug-fix
   ```
3. Install dependencies and set up your local environment:
   ```bash
   npm install
   cp .env.example .env.local
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Before committing, verify TypeScript types and linting:
   ```bash
   npm run typecheck
   npm run lint
   ```
6. Commit using [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat(mentors): add debounced search filter"
   ```
7. Push to your fork and open a Pull Request against the `main` branch.

---

## 🏛️ Architectural Standards

All contributions must respect the core project rules defined in `AGENTS.md`:

- **Clean Layer Separation:** All Supabase database queries and mutations must live in `lib/services/` or `app/actions/`. Never query the database directly inside UI components or custom hooks.
- **React Server Components by Default:** Only add `"use client"` when strictly necessary (event handlers, interactive state, browser APIs).
- **Security & RLS First:** Never attempt to bypass Row Level Security. Never suggest or use `service_role` in user-facing endpoints.
- **Strict TypeScript:** No `any`. Use [Zod](https://zod.dev/) schemas to validate external boundaries (API requests, forms, URL parameters).
- **No N+1 Queries:** Prefer joined queries (`select('*, relation(*)')`) over loops of asynchronous requests.
- **Component Sizing:** Keep components focused and under ~150 lines. Extract subcomponents when complexity grows.
- **Internationalization (i18n):** All user-facing text must use `next-intl`. Ensure keys are populated across `messages/pt-BR.json`, `messages/en.json`, and `messages/es.json`.

---

## 📝 Commit Conventions

We enforce Conventional Commits:

- `feat:` A new user-facing feature.
- `fix:` A bug fix.
- `refactor:` Code restructuring without changing behavior.
- `chore:` Maintenance, package upgrades, or tool configurations.
- `docs:` Documentation changes only.
- `test:` Adding or updating tests.

---

## 💬 Getting Help & Communication

- **Official Website:** [https://www.menvo.com.br](https://www.menvo.com.br)
- **Support & Inquiries:** [contato@menvo.com.br](mailto:contato@menvo.com.br)
- **WhatsApp Support:** [+55 (81) 99509-7377](https://wa.me/5581995097377)
- **LinkedIn:** [Menvo on LinkedIn](https://www.linkedin.com/company/menvo/)
- **Instagram:** [@menvobr](https://www.instagram.com/menvobr/)

Thank you for helping us transform careers through voluntary mentorship!
