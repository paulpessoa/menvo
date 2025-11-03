-- =================================================================
-- FIX RLS RECURSION IN ORGANIZATIONS TABLE
-- Remove recursive policies and use the security definer function
-- =================================================================

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "org_admins_can_view_own_organization" ON public.organizations;
DROP POLICY IF EXISTS "org_admins_can_update_own_organization" ON public.organizations;

-- Recreate policies using the security definer function (no recursion)
-- Note: We use the is_organization_admin function created in the previous migration

CREATE POLICY "org_admins_can_view_own_organization" 
ON public.organizations
FOR SELECT
USING (
  public.is_organization_admin(id, auth.uid())
);

CREATE POLICY "org_admins_can_update_own_organization" 
ON public.organizations
FOR UPDATE
USING (
  public.is_organization_admin(id, auth.uid())
);

