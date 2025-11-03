-- =================================================================
-- FIX RLS RECURSION IN ORGANIZATION_MEMBERS TABLE
-- Remove recursive policies and create non-recursive versions
-- =================================================================

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "org_admins_can_view_org_members" ON public.organization_members;
DROP POLICY IF EXISTS "org_admins_can_invite_members" ON public.organization_members;
DROP POLICY IF EXISTS "org_admins_can_update_org_members" ON public.organization_members;
DROP POLICY IF EXISTS "org_admins_can_delete_org_members" ON public.organization_members;

-- Create a security definer function to check if user is org admin
-- This breaks the recursion by using a function with security definer
CREATE OR REPLACE FUNCTION public.is_organization_admin(org_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.organization_members
    WHERE organization_id = org_id
      AND organization_members.user_id = is_organization_admin.user_id
      AND role = 'admin'
      AND status = 'active'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_organization_admin(UUID, UUID) TO authenticated;

-- Recreate policies using the security definer function (no recursion)
CREATE POLICY "org_admins_can_view_org_members" 
ON public.organization_members
FOR SELECT
USING (
  public.is_organization_admin(organization_id, auth.uid())
);

CREATE POLICY "org_admins_can_invite_members" 
ON public.organization_members
FOR INSERT
WITH CHECK (
  public.is_organization_admin(organization_id, auth.uid())
);

CREATE POLICY "org_admins_can_update_org_members" 
ON public.organization_members
FOR UPDATE
USING (
  public.is_organization_admin(organization_id, auth.uid())
);

CREATE POLICY "org_admins_can_delete_org_members" 
ON public.organization_members
FOR DELETE
USING (
  public.is_organization_admin(organization_id, auth.uid())
);

-- Add comment
COMMENT ON FUNCTION public.is_organization_admin(UUID, UUID) IS 'Security definer function to check if user is admin of organization (prevents RLS recursion)';

