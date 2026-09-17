# 🏢 Multi-Tenant Roadmap — Menvo for Organizations

> **Status: Phase 1 shipped and merged to `main` (PR #45). Phase 1.5 planned,
> not started — see §6.** Written 2026-09-16 based on the founder's
> vision to offer Menvo as infrastructure to partner organizations (Instituto
> Gira, Porto Social, Instituto Braude's reading circle, SEBRAE, online
> hackathons, etc.) so they can register the youth/beneficiaries they serve
> and tap into (or bring) mentors — while keeping the free public
> mentor-mentee core loop as the backbone. Read
> [`docs/STATUS.md`](STATUS.md) (Engineering Journal, "Earlier Milestones")
> for why this direction was previously reversed — that history matters for
> how this got rebuilt.

---

## 0. Important context: this was already tried and removed once

`docs/STATUS.md` → Engineering Journal, "Earlier Milestones": **"Organization
Module Deprecation: Removed multi-tenant organizations in favor of a lean,
direct mentor-to-mentee relationship."** The same journal lists "Dashboard
Simplification (Anti-Overengineering)" as a completed P1 item. The old
implementation left real fossils behind (its deployment guide has since been
deleted as obsolete — this is what it covered):

- A full deployment
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

## 5. Status — Phase 1 built and applied (2026-09-17)

Migrations `20260921000000..000002` are applied to production. What's live
on `feat/multi-tenant-phase1` (PR #45):

**Membership is a stateful relation the person controls from their profile**
(`organization_members.status`: `invited` | `requested` | `active`):

| Who starts it | Where | Result |
|---|---|---|
| Org admin invites by e-mail | `/dashboard/org` → Convidar | `invited` + e-mail `sendOrgInvite` |
| Person asks to join | `/o/[slug]` → Solicitar participação | `requested` + e-mail to org admins |
| Org admin approves | `/dashboard/org` → ✓ | `active` + e-mail `sendOrgMembershipApproved` |
| Person accepts invite | `/profile?tab=organizations` → Aceitar | `active` |
| Person leaves / declines / withdraws | `/profile?tab=organizations` | row deleted |

- Invites require an existing Menvo account (the org admin gets a clear
  message otherwise: share the `/o/[slug]` link). No org-specific signup
  page — `/signup?next=/o/[slug]` brings a new account back to the org page.
- `/dashboard/admin/organizations` — platform admin: create org, suspend/
  reactivate, assign an org admin by e-mail.
- RLS: self read/request/accept/leave; org admins (`is_org_admin()`,
  security definer to avoid policy recursion) manage their org's rows;
  platform admins see everything. `/o/*` pages filter `status = 'active'`
  explicitly because platform admins can read suspended orgs via RLS.
- Mentor-side catalog visibility filter: **not built** (Phase 2, §3).

**Known gaps / next:**
- A brand-new account that signs up from `/o/[slug]` is sent to `/onboarding`
  first (role picker) and loses `next`; they have to reopen the org link.
  Fine for the pilot; fix if Gira's beneficiaries trip on it.
- Org affiliation isn't shown on public mentor cards yet.
- Test org "Org Teste Claude" (suspended) can be deleted from the SQL editor.

---

## 6. Phase 1.5 — plan (2026-09-17, agreed with founder, not started)

Triggered by review of the merged Phase 1 (#45). Three founder questions
and the answers we're building to:

**Q1. Can an org add mentors *and* admins, or one or the other?**
Both, and it needs no new membership role. A member is whatever they already
are on the platform (`user_roles`: mentor or mentee). So:
`organization_members.role` stays `admin | member`, and the org dashboard
*derives* "beneficiary" vs "org mentor" from the person's platform role.
An org admin can also be a mentor or mentee themselves. Reports split by
that derived kind.

**Q2. Should the org choose whether `/o/[slug]` is public?**
Yes — `organizations.join_policy`: `open` (default; anyone logged in can
request) | `invite_only` (page still resolves for people who hold an invite
link, but shows "participação por convite" and no request button; excluded
from sitemap, `noindex`). Requesting always requires login (that's already
the case); the policy only controls whether strangers can *ask*.

**Q3. Emails must be coherent with the above.** Yes — copy is picked by the
recipient's platform role (mentor vs mentee), and the sentence "acompanha
sua jornada ... mentores dedicados a ela" goes away. See 6.3.

### 6.1 Data
- Migration `20260921000003_org_join_policy.sql`:
  `alter table organizations add column join_policy text not null
  default 'open' check (join_policy in ('open','invite_only'))`.
  Update `organization_members_self_request` policy to also require
  `o.join_policy = 'open'` in its `exists(...)` subquery.
- Regenerate `lib/types/supabase.ts` (`npm run db:types`) after push.

### 6.2 API
- `GET /api/org/[id]` (`app/api/org/[id]/route.ts`): for each member also
  return `platformRole: 'mentor' | 'mentee' | null` (join `user_roles ->
  roles(name)`; pick mentor if present, else mentee). Add `summary`:
  `{ beneficiaries, mentors, pendingRequests, pendingInvites,
  sessionsBookedByBeneficiaries, sessionsGivenByOrgMentors }`.
  `sessionsGivenByOrgMentors` = appointments where `mentor_id` in org
  mentor ids.
- `PATCH /api/org/[id]` (new): org admin updates `join_policy` (zod enum).
- `POST /api/me/organizations`: return 403 with a clear message when
  `join_policy = 'invite_only'` and no invite row exists.
- `POST /api/org/[id]/members` (invite): pass the invitee's platform role
  to the email so the copy matches.

### 6.3 Emails (`lib/email/brevo.ts`)
Rewrite the three org templates with role-aware copy:
- `sendOrgInvite({ ..., recipientRole })`:
  - mentee: "A {org} quer acompanhar sua jornada de mentoria na Menvo.
    Ao aceitar, a organização passa a ver seu progresso (sessões, quiz)
    para te apoiar melhor."
  - mentor: "A {org} quer contar com você como mentor(a) do grupo dela na
    Menvo. Ao aceitar, você aparece como mentor da organização e pode
    receber pedidos dos beneficiários dela."
- `sendOrgMembershipApproved({ ..., recipientRole })`: same split; the
  CTA is "Encontrar um mentor" for mentees and "Ver minha agenda" for
  mentors. Drop "Tudo continua gratuito" (true, but reads as a disclaimer).
- `sendOrgJoinRequestToAdmin`: include "(mentor)"/"(mentorado)" after the
  requester's name.
- Update the three `case 'org_*'` previews accordingly; add a mentor
  variant preview key (`org_invite_mentor`) so the admin can see both.

### 6.4 UI
- `/dashboard/org` (`app/[locale]/dashboard/org/page.tsx`):
  - Header cards: Beneficiários / Mentores / Sessões (from `summary`).
  - Split the members table into two: "Beneficiários" and "Mentores da
    organização" (by `platformRole`). Keep invite + pending panels.
  - Settings card: "Página pública" toggle → `join_policy`, with helper
    text: "Aberta: qualquer pessoa logada pode solicitar. Somente por
    convite: só quem você convidar entra."
- `/o/[slug]` + `JoinOrganizationButton`: when `invite_only` and viewer
  has no invite row, render "Esta organização entra por convite" (no
  request button). When invited, keep "Aceitar convite".
- `OrganizationsTab` (profile): show "Mentor da organização" vs
  "Beneficiário" badge next to each active membership, from the viewer's
  own platform role.
- `MentorCard`/mentor profile: small "Mentor da {org}" chip for active
  org mentors — **only if** the org is `open` (an invite-only org is not
  advertised on public cards). Skip if it complicates the card; note it in
  §7 instead.

### 6.5 SEO / sitemap
- `app/sitemap.ts`: add `/o/[slug]` for every org with `status='active'
  and join_policy='open'`, all locales, priority 0.6, weekly.
- `app/[locale]/o/[slug]/page.tsx`: `generateMetadata` with title
  "{org.name} na Menvo", description, OG image (site default), canonical;
  `robots: { index: false }` when `invite_only`.
- `public/robots.txt`: nothing to add (`/o/` is public by design).
- `llms.txt` / `llms-full.txt`: one line describing partner org pages.

### 6.6 Cleanup / docs
- `docs/MULTI_TENANT_ROADMAP.md`: fold this section into §5 once shipped.
- Delete test org "Org Teste Claude" via SQL editor once done.

### 6.7 Verification
- `tsc --noEmit`, jest, then in preview: toggle `join_policy`, confirm the
  landing hides the request button and sitemap.xml drops the org; invite a
  mentor and a mentee and check both email previews; org dashboard shows
  the two tables and correct counts.
