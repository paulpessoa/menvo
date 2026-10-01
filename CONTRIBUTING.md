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

### Sync with `main` before opening a PR

Always start from, and finish on, the latest `main`. Stale branches carry already-merged commits and old file versions, so the PR shows far more differences than the change itself and invites bad conflict resolutions. This applies to humans and to AI agents (local or cloud).

0. **Check the git identity** (`git config user.name` / `user.email`). Cloud agent environments may default to an AI identity such as `Claude <noreply@anthropic.com>`; set the maintainer's identity for the repo before the first commit, otherwise the commits are authored by the AI and the `No AI attribution` check fails.
1. **Before starting:** `git fetch origin && git checkout -b <branch> origin/main` (never branch from an old local `main` or from another feature branch).
2. **Before pushing / opening the PR:** `git fetch origin && git merge origin/main` (or rebase, on a branch only you use).
3. **Check the diff is only your change:** `git diff origin/main...HEAD --stat`. Unrelated files listed → the branch is stale or carries other work; fix it before opening the PR.
4. **Resolve conflicts consciously:** after a merge run `git diff --name-only --diff-filter=U` and `grep -rn "^<<<<<<<\|^>>>>>>>" .` before committing. Never commit conflict markers; validate JSON files (`messages/*.json`).
5. **One task, one branch.** Do not stack new work on a branch whose PR is already merged or still open with other changes.

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

### No AI attribution

Never credit an AI tool as author, committer or co-author of a commit or PR: no `Co-authored-by: Claude ...`, no "Generated with ..." lines, no session links, in commit messages, PR titles or PR bodies. This applies to humans and to AI agents working in any environment (local, cloud, web).

When squash-merging on GitHub, check the merge message for an AI trailer before confirming. The `No AI attribution` workflow fails PRs that break this rule.

---

## ✍️ Content & UX Writing Contributions (no coding needed)

You don't need to run the project to improve Menvo's copy. All UI text lives in three files:

- `messages/pt-BR.json` (source of truth)
- `messages/en.json`
- `messages/es.json`

To suggest a change, open one of these files on GitHub, click the pencil icon, edit the text and choose **"Propose changes"**. GitHub creates the fork and the Pull Request for you. Keep the JSON keys untouched and change only the values; placeholders such as `{name}` must stay as they are.

Some screens still have text written directly in the components instead of in these files. If you find one, open an issue with a screenshot and your suggested wording, and we will move it into `messages/`.

Larger reviews (tone of voice, glossary, a whole flow) are welcome as an issue first, so we can agree on the scope before anyone edits many files.

---

## 💬 Getting Help & Communication

- **Official Website:** [https://www.menvo.com.br](https://www.menvo.com.br)
- **Support & Inquiries:** [contato@menvo.com.br](mailto:contato@menvo.com.br)
- **WhatsApp Support:** [+55 (81) 99509-7377](https://wa.me/5581995097377)
- **LinkedIn:** [Menvo on LinkedIn](https://www.linkedin.com/company/menvo/)
- **Instagram:** [@menvobr](https://www.instagram.com/menvobr/)

Thank you for helping us transform careers through voluntary mentorship!
