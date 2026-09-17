# 🏢 Multi-Tenant Roadmap — Menvo for Organizations

> **Status: Phase 1 built on `feat/multi-tenant-phase1`, migration not yet
> applied to production — see §5.** Written 2026-09-16 based on the founder's
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

## 1. Decisions — answered 2026-09-16

1. **Live DB state (verified with `supabase gen types` against production):**
   `organizations` and `organization_members` are **gone**. What survives:
   - `mentor_visibility_settings` table (`visibility_scope`,
     `visible_to_organizations text[]`) — reusable as-is.
   - ~10 orphaned SQL functions referencing the dropped tables:
     `check_organization_quota`, `get_organization_quota_usage`,
     `expire_organization_memberships`, `expire_partner_invitations`,
     `expire_user_partner_access`, `get_mentor_visible_organizations`,
     `get_mentors_by_organization`, `get_user_organization_ids`,
     `is_organization_admin`, `user_has_partner_access`. They will error if
     called. **Phase 1 migration should `DROP FUNCTION` all of them** before
     creating the new tables, so names don't collide with stale definitions.
   - Conclusion: build from scratch, lean. No "trim v1" shortcut.
2. **Beneficiaries get a real login** (founder's call). An org beneficiary is
   a normal mentee account tagged with `organization_id`. Keep the org-facing
   surface minimal; grow it only when a partner asks.
3. **Orgs can bring their own mentors, and the mentor decides visibility**:
   public to everyone, or only to members of their org. This maps 1:1 onto
   the existing `mentor_visibility_settings.visibility_scope` +
   `visible_to_organizations` — no new concept needed.
4. **Free pilot.** No quotas, no billing. Dropping `check_organization_quota`
   is fine.
5. **URL: path prefix `/o/[slug]/...`** for the pilot. No subdomain, no
   branding.
6. **First pilot: Instituto Gira** — founder can talk to Leonildo (diretor
   presidente) from the week of 2026-09-21. Schema below is designed so that
   call can only *add* scope, not invalidate it.

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

## 4. Phase 1 — concrete design (ready to implement)

**Migration `supabase/migrations/<ts>_organizations_v2.sql`:**
```sql
-- 1. Drop orphaned v1 functions (see Section 1.1)
-- 2. Tables
create table organizations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,             -- /o/[slug]
  name text not null,
  type text not null check (type in ('ngo','company','event','school','other')),
  contact_name text, contact_email text,
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz default now()
);
create table organization_members (
  organization_id uuid references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text not null check (role in ('admin','member')),   -- member = beneficiary OR org mentor
  created_at timestamptz default now(),
  primary key (organization_id, user_id)
);
-- 3. RLS: members read their own org; org admins read members of their org;
--    platform admins (user_roles.role = admin) read everything.
```
Mentor-side visibility: reuse `mentor_visibility_settings`. `/mentors`
catalog query adds `where visibility_scope = 'public' or organization_id =
any(visible_to_organizations)` for logged-in org members.

**Routes (all reuse existing pages/components — no forks):**
- `/o/[slug]` — public landing: org name + "Cadastre-se" CTA. Tiny.
- `/o/[slug]/signup` — `signup/page.tsx` with `?org=slug` → after account
  creation inserts `organization_members(role='member')`.
- `/dashboard/org` — org admin view: members list (name, quiz done?, sessions
  booked/completed), read-only. Guarded by `organization_members.role='admin'`.
- `/dashboard/admin/organizations` — platform admin: create org, assign org
  admin by email, suspend.
- Mentor profile settings: existing visibility UI gets the org picker
  (already backed by `/api/mentors/visibility`).

**Out of scope until a partner asks:** invitations, activity log,
membership expiry, CSV import, branding, multi-org per user, quotas.

**Where it grows next (Phase 2+):** org-scoped reports/export, org admin
inviting mentors by email, subdomain branding, per-org quiz variants.

## 5. Status — Phase 1 built, migration not yet applied (2026-09-16)

Code for the plan above is on `feat/multi-tenant-phase1`:
- `supabase/migrations/20260921000000_organizations_v2.sql` — drops the
  orphaned v1 functions, creates `organizations` + `organization_members`
  with RLS (self-read, org-admin read, platform-admin full access, and a
  self-join policy so a new signup can tag its own `member` row).
- `/o/[slug]` public landing + `/o/[slug]/signup` (reuses the real
  `SignupForm`, bypassing the waiting-list gate — org partners get real
  accounts immediately).
- `app/auth/callback/route.ts` tags the account with its org and
  auto-assigns the `mentee` role on email confirmation, reading
  `pending_organization_slug` off signup metadata.
- `/dashboard/admin/organizations` — platform admin: create org, suspend/
  reactivate, assign an org admin by email.
- `/dashboard/org` — org admin's own scoped dashboard: beneficiary list
  with quiz-done / sessions-booked stats.
- Mentor-side catalog visibility filter was **not** built — confirmed
  correctly out of scope for Phase 1 (§3).

**Not yet done, and needs the founder either way:**
1. **Apply the migration to production** (`supabase db push` or paste the
   SQL into the Supabase SQL editor) — nothing above works until the tables
   exist. Do this deliberately, ideally right before the Gira call so the
   demo is live, not blind before a review.
2. Open/merge the PR for `feat/multi-tenant-phase1`.
3. After merge + migration, create the Instituto Gira org via
   `/dashboard/admin/organizations` and hand Leonildo the `/o/instituto-gira`
   link.
