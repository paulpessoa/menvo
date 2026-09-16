# 🏢 Multi-Tenant Roadmap — Menvo for Organizations

> **Status: proposal, not started.** Written 2026-09-16 based on the founder's
> vision to offer Menvo as infrastructure to partner organizations (Instituto
> Gira, Porto Social, Instituto Braude's reading circle, SEBRAE, online
> hackathons, etc.) so they can register the youth/beneficiaries they serve
> and tap into (or bring) mentors — while keeping the free public
> mentor-mentee core loop as the backbone. This is a planning document; no
> schema or code changes were made tonight. Read [`docs/JOURNAL.md`](JOURNAL.md)
> and [`docs/BACKLOG.md`](BACKLOG.md) for why this direction was previously
> reversed — that history matters for how this should be rebuilt.

---

## 0. Important context: this was already tried and removed once

`docs/JOURNAL.md` → "Earlier Milestones": **"Organization Module
Deprecation: Removed multi-tenant organizations in favor of a lean, direct
mentor-to-mentee relationship."** `docs/BACKLOG.md` also lists "Dashboard
Simplification (Anti-Overengineering)" as a completed P1 item. The old
implementation left real fossils behind:

- `docs/archive/ORGANIZATIONS_V1_DEPLOYMENT_GUIDE.md` — a full deployment
  guide for `organizations`, `organization_members`,
  `mentor_visibility_settings`, `organization_activity_log` tables, invitation
  flows, and expiration cron jobs.
- `lib/types/supabase.ts` still declares SQL functions that only make sense
  if organization tables exist: `check_organization_quota`,
  `expire_organization_memberships`, `get_expiring_memberships` (returns
  `organization_id`/`organization_name`), `get_mentor_visible_organizations`,
  `get_mentors_by_organization`, `expire_partner_invitations`,
  `expire_user_partner_access`, `generate_unique_slug`.
- `mentor_visibility_settings.visible_to_organizations` (a live column, used
  today in `app/api/mentors/visibility/route.ts`) already models "this mentor
  opts to be visible to organization X".

**What this means**: either the `organizations`/`organization_members` tables
still exist live in Supabase and `lib/types/supabase.ts` is just stale (the
generated-types script failed tonight — see "Open question #1" below), or
they were dropped and these functions are dead/broken. Either way, **do not
design this from a blank slate** — the first real step is finding out exactly
what's still there, so the rebuild reuses instead of duplicates.

**The lesson to carry forward**: the previous version was reversed for being
over-engineered and diluting the core 1:1 mentorship loop. The plan below is
deliberately leaner than v1 — fewer tables, no invitation/activity-log
sprawl until a real partner proves the need for it.

---

## 1. Open questions only the founder can answer

These block any real schema work — answer them before Phase 1 starts:

1. **Does the live Supabase DB still have `organizations` /
   `organization_members`?** Run `npm run db:types` with a valid
   `SUPABASE_ACCESS_TOKEN` (tonight's attempt failed — token in `.env.local`
   returned `Unauthorized`, needs refreshing at
   [supabase.com/dashboard](https://supabase.com/dashboard/account/tokens))
   or check the Supabase Table Editor directly.
2. **What does "register beneficiaries" actually mean for a partner like
   Gira?** Two very different data models depending on the answer:
   - (a) Each beneficiary gets a real Menvo account (mentee role), tagged
     with `organization_id` — they can log in, book sessions, see history.
   - (b) Gira staff bulk-register names/contacts as *leads*, Menvo (or Gira)
     matches them to a mentor, and the beneficiary experience is lighter
     (maybe no login at all, just email/WhatsApp coordination).
   These require a 30-minute scoping call with Gira before writing schema —
   guessing wrong here means rebuilding twice.
3. **Do partner orgs bring their own mentors, or draw from Menvo's existing
   pool, or both?** Determines whether "org-exclusive mentors" (opt-in via
   the existing `visible_to_organizations` column) is enough, or whether
   orgs need their own mentor onboarding flow.
4. **Free pilot or paid?** `check_organization_quota` already existing in
   the DB functions suggests v1 had a quota/plan concept — decide if that's
   relevant for a pilot with 1-2 partners or premature until there's demand.
5. **URL/branding strategy**: subdomain (`gira.menvo.com.br`), path prefix
   (`menvo.com.br/o/gira`), or no visible branding at all for the pilot
   (just an admin dashboard, no distinct beneficiary-facing URL)? Path
   prefix is the cheapest to ship and is recommended for a pilot — no DNS,
   no wildcard SSL config on Vercel.

---

## 2. Recommended phased plan (pending answers above)

```
Phase 0: Discovery          Phase 1: MVP                 Phase 2: Opt-in mentors      Phase 3: Branding/scale
──────────────────          ────────────                 ──────────────────────      ───────────────────────
- Confirm live DB state     - organizations table         - Reuse                     - Custom subdomain
- 1 scoping call w/ Gira      (id, slug, name, type,        visible_to_organizations    or path branding
- Answer Q2-Q5 above           contact_email)               for org-exclusive mentors  - Quotas/plans if
                            - organization_members         - Org-scoped mentor           check_organization_quota
                              (org_id, user_id, role)         invite flow                 is still needed
                            - /o/[slug]/signup tags        - Org admin can see          - Multiple concurrent
                              new mentees with org_id         "their" mentor pool          pilots
                            - Org admin dashboard:
                              list beneficiaries + basic
                              stats (bookings, quiz done)
                            - Pilot with ONE partner
                              (Gira) before generalizing
```

### Why this order
- **Phase 1 deliberately skips** invitation emails, activity logs, and
  membership expiration cron jobs from v1 — those are exactly the kind of
  scope that got the previous version reversed. Add them only if the Gira
  pilot proves they're needed, not preemptively.
- **Phase 1 reuses the existing mentee signup/dashboard/booking flow
  entirely** — an org-tagged mentee is still just a mentee (`user_roles`,
  `profiles`, `appointments` unchanged). The only new surface is: (a) a
  `organization_id` tag at signup, and (b) a read-only admin view scoped to
  that tag. This is the leanest possible version of "multi-tenant."
- **Mentor-side changes wait for Phase 2** on purpose — the core value prop
  for a pilot partner is "get your beneficiaries matched with mentors,"
  which Phase 1 already delivers using the existing public mentor pool. Org-
  exclusive/private mentor pools are a real feature but not required to
  validate the concept.

---

## 3. Concrete Phase 1 scope (once discovery answers land)

**New tables** (or confirm+reuse existing ones from live DB check):
- `organizations`: `id`, `slug` (unique, used in `/o/[slug]/...` URLs),
  `name`, `type` (`ngo` | `company` | `event` | `other`), `contact_email`,
  `contact_name`, `created_at`, `status` (`pending` | `active` |
  `suspended`).
- `organization_members`: `organization_id`, `user_id`, `role` (`admin` |
  `beneficiary`), `created_at`. A user can belong to at most one org as
  `beneficiary` initially (keep it simple — multi-org membership is a Phase
  3+ problem if it ever comes up).

**New routes**:
- `/o/[slug]/signup` — same signup form as `/signup`, but sets
  `organization_id` on the created profile/member row. Reuses
  `app/[locale]/(auth)/signup/page.tsx` logic, not a fork.
- `/dashboard/admin/organizations` — global admin: approve pending orgs,
  see org list (superset of what `/dashboard/admin/users` already does,
  filtered by org).
- `/dashboard/org/[slug]` — org admin's own scoped dashboard: list of their
  beneficiaries, whether each completed the quiz / booked a session,
  aggregate counts. Read-only for the pilot; no bulk CSV import yet unless
  Gira specifically needs it for their existing beneficiary list.

**Explicitly out of scope for Phase 1**: custom branding, org-exclusive
mentors, invitation emails, membership expiration, billing/quotas, bulk CSV
import, multi-org membership per user.

---

## 4. Immediate next step

Before any code: **schedule the scoping call with Gira** (or whichever
partner is closest to signing on) to answer questions 2-5 in Section 1. Also
run `npm run db:types` with a fresh Supabase access token to settle question
1 — that alone might save a full day of schema design if the old tables are
still there and just need a Phase 1-sized trim.
