# Documentation Map

This repo has **two documentation trees** for two different audiences (see
[`AI_PLATFORM_PLAN.md`](AI_PLATFORM_PLAN.md) §6.1 for the reasoning):

- **`docs/`** — internal: engineering and governance. For agents and
  contributors working on the codebase.
- **`kb/`** — external: what the AI copilot can read and cite back to
  end users (pt-BR). Not implemented yet (Fase 2 of the AI plan) — the
  folders exist so the target layout is visible, but no articles have been
  written.

Always read [`STATUS.md`](STATUS.md) first in any session — it's the
single source of truth for current state, backlog, and the engineering
journal, and it links out to everything else.

## `docs/` tree

```
docs/
  README.md                   this file
  STATUS.md                   state, backlog, engineering journal — read first
  VISION.md                   product purpose and north star
  GOOGLE_OAUTH_SUBMISSION.md  Google Cloud Console OAuth verification kit
  AI_PLATFORM_PLAN.md         AI-first plan (diagnostic, copilot, metering, KB)
  SPEC_MCP_ASSISTANT.md       MCP assistant spec
  governance/
    adr/NNNN-titulo.md        architecture decision records
    ai-policy.md              allowed models, budget, data sent to LLMs, retention, LGPD
    doc-standards.md          required frontmatter, review cadence, definition of done
    glossary.md               mentee, mentor, org, session, diagnostic, credit…
  architecture/
    overview.md               context and containers (C4 level 1-2), BFF flow
    data-model.md             per-domain ERD (mermaid) + tables and RLS
    security.md               RLS, security definer, auth, rate limiting
    ai-platform.md            AI_PLATFORM_PLAN.md, once implemented, becomes this reference
  domains/                    one file per business domain
    scheduling.md             availability engine, 14-day projection, conflict detection
    organizations.md          multi-tenant organizations: decisions, phases, roadmap
    auth-and-roles.md, profiles.md, mentor-catalog.md, mentorship-lifecycle.md,
    evaluations.md, diagnostic.md, notifications-email.md, feature-flags.md, admin.md
  operations/
    environment-variables.md  environment variables reference across environments
    deploy.md, cron-jobs.md, runbooks/  (deploy process, cron jobs, incident runbooks)
  product/
    seo.md                    search engine, LLMs/Geo SEO, image guidelines
    roadmap.md                product roadmap
```

Domain, architecture, and operations files marked above without a
one-line description don't exist yet — they're placeholders in the target
layout (empty directories keep a `.gitkeep` until their first file lands).

## `kb/` tree (not started — Fase 2)

```
kb/
  _index.json      generated at build time: id, title, roles, tags, summary
  comecando/       what Menvo is, is it free?, how to create an account
  mentorados/      how to find a mentor, schedule, prepare, evaluate, diagnostic
  mentores/        how to become a mentor, verification, availability, Google Calendar
  organizacoes/    what a partner org is, joining, invites
  politicas/       code of conduct, privacy, AI usage
  faq/
```

## Required frontmatter

Every file in `kb/` and in `docs/domains/` must start with this
frontmatter block:

```yaml
---
title: Como agendar uma sessão
audience: [mentee]            # kb only: roles that may receive this content
owner: paul
status: current               # draft | current | deprecated
last_reviewed: 2026-09-23
source_of_truth: [app/api/appointments/schedule/route.ts]   # code this describes
---
```

`docs/governance/doc-standards.md` (not written yet) will hold the full
rationale and the CI check (`scripts/docs/check.ts`, also not written yet)
that validates it — see `AI_PLATFORM_PLAN.md` §6.3.

## Moving or renaming a doc

Update every internal link that points to it in the same commit. Check
with:

```
git grep -n "old-filename"
```
