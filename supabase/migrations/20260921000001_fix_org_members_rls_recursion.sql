-- The org-admin read policy on organization_members selected from
-- organization_members inside its own USING clause, which Postgres rejects
-- with "infinite recursion detected in policy". Route the check through a
-- security definer function so the policy evaluation bypasses RLS.

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
  );
$$;

revoke all on function public.is_org_admin(uuid) from public;
grant execute on function public.is_org_admin(uuid) to authenticated;

drop policy if exists "organization_members_org_admin_read" on organization_members;

create policy "organization_members_org_admin_read"
  on organization_members for select
  using (public.is_org_admin(organization_id));
