-- Membership becomes a stateful relation the person controls from their
-- profile (invited -> active, requested -> active, leave). Replaces the
-- signup-time tagging from Phase 1's first cut.

alter table organization_members
  add column if not exists status text not null default 'active'
  check (status in ('invited', 'requested', 'active'));

-- Self-join now creates a *request* (needs org-admin approval), never an
-- active membership directly.
drop policy if exists "organization_members_self_join" on organization_members;
create policy "organization_members_self_request"
  on organization_members for insert
  with check (
    user_id = auth.uid()
    and role = 'member'
    and status = 'requested'
    and exists (select 1 from organizations o where o.id = organization_id and o.status = 'active')
  );

-- A person accepts their own invite (invited -> active). They cannot
-- self-approve a request or change their role.
create policy "organization_members_self_accept_invite"
  on organization_members for update
  using (user_id = auth.uid() and status = 'invited')
  with check (user_id = auth.uid() and status = 'active' and role = 'member');

-- A person leaves (or declines an invite / withdraws a request).
create policy "organization_members_self_leave"
  on organization_members for delete
  using (user_id = auth.uid());

-- Org admins manage every membership row of their own org: invite, approve,
-- remove, promote.
create policy "organization_members_org_admin_write"
  on organization_members for insert
  with check (public.is_org_admin(organization_id));

create policy "organization_members_org_admin_update"
  on organization_members for update
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

create policy "organization_members_org_admin_delete"
  on organization_members for delete
  using (public.is_org_admin(organization_id));

-- Only *active* admins administer the org (an invited/requested admin row
-- shouldn't exist, but make the check explicit now that status exists).
create or replace function public.is_org_admin(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from organization_members
    where organization_id = p_organization_id
      and user_id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;
