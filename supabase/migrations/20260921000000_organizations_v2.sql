-- Multi-tenant Phase 1 (see docs/MULTI_TENANT_ROADMAP.md §4).
-- Lean rebuild: v1's organizations/organization_members tables were already
-- dropped from production. This migration also removes the ~10 orphaned SQL
-- functions v1 left behind, so their names don't collide with anything here.

-- 1. Drop orphaned v1 functions (verified live 2026-09-16, see roadmap §1.1)
drop function if exists check_organization_quota(uuid);
drop function if exists get_organization_quota_usage(uuid);
drop function if exists expire_organization_memberships();
drop function if exists expire_partner_invitations();
drop function if exists expire_user_partner_access();
drop function if exists get_mentor_visible_organizations(uuid);
drop function if exists get_mentors_by_organization(uuid);
drop function if exists get_user_organization_ids(uuid);
drop function if exists is_organization_admin(uuid);
drop function if exists user_has_partner_access(uuid);

-- 2. Tables
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  type text not null check (type in ('ngo', 'company', 'event', 'school', 'other')),
  contact_name text,
  contact_email text,
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now()
);

create table if not exists organization_members (
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index if not exists organization_members_user_id_idx on organization_members(user_id);

-- 3. RLS
alter table organizations enable row level security;
alter table organization_members enable row level security;

-- Anyone can read active orgs (needed for the public /o/[slug] landing page).
create policy "organizations_public_read_active"
  on organizations for select
  using (status = 'active');

-- Platform admins (user_roles.role = 'admin') manage every organization.
create policy "organizations_platform_admin_all"
  on organizations for all
  using (
    exists (
      select 1 from user_roles ur
      join roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.name = 'admin'
    )
  )
  with check (
    exists (
      select 1 from user_roles ur
      join roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.name = 'admin'
    )
  );

-- A member reads their own membership rows.
create policy "organization_members_self_read"
  on organization_members for select
  using (user_id = auth.uid());

-- An org admin reads every member row of their own org.
create policy "organization_members_org_admin_read"
  on organization_members for select
  using (
    exists (
      select 1 from organization_members admin_row
      where admin_row.organization_id = organization_members.organization_id
        and admin_row.user_id = auth.uid()
        and admin_row.role = 'admin'
    )
  );

-- Platform admins read/write every membership row.
create policy "organization_members_platform_admin_all"
  on organization_members for all
  using (
    exists (
      select 1 from user_roles ur
      join roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.name = 'admin'
    )
  )
  with check (
    exists (
      select 1 from user_roles ur
      join roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.name = 'admin'
    )
  );

-- Self-signup: an authenticated user can tag themselves as a 'member' of an
-- active org (used by /o/[slug]/signup via the auth callback). They cannot
-- self-assign 'admin' or join a suspended org.
create policy "organization_members_self_join"
  on organization_members for insert
  with check (
    user_id = auth.uid()
    and role = 'member'
    and exists (select 1 from organizations o where o.id = organization_id and o.status = 'active')
  );
