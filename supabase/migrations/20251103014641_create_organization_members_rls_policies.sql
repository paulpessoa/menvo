-- =================================================================
-- CREATE RLS POLICIES FOR ORGANIZATION_MEMBERS TABLE - Multi-Tenant System
-- Row Level Security policies for organization_members table
-- =================================================================

-- Enable RLS on organization_members table
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own memberships
CREATE POLICY "users_can_view_own_memberships" 
ON public.organization_members
FOR SELECT
USING (user_id = auth.uid());

-- Policy: Organization admins can view all members of their organization
CREATE POLICY "org_admins_can_view_org_members" 
ON public.organization_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.organization_members om
    WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
      AND om.status = 'active'
  )
);

-- Policy: Organization admins can invite members (INSERT)
CREATE POLICY "org_admins_can_invite_members" 
ON public.organization_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.organization_members om
    WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
      AND om.status = 'active'
  )
);

-- Policy: Users can update their own membership status (accept/decline/leave)
CREATE POLICY "users_can_update_own_membership" 
ON public.organization_members
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy: Organization admins can update members of their organization
CREATE POLICY "org_admins_can_update_org_members" 
ON public.organization_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM public.organization_members om
    WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
      AND om.status = 'active'
  )
);

-- Policy: Organization admins can delete members from their organization
CREATE POLICY "org_admins_can_delete_org_members" 
ON public.organization_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM public.organization_members om
    WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
      AND om.status = 'active'
  )
);

-- Policy: Platform admins can view all memberships
CREATE POLICY "platform_admins_can_view_all_memberships" 
ON public.organization_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
      AND r.name = 'admin'
  )
);

-- Policy: Platform admins can manage all memberships
CREATE POLICY "platform_admins_can_manage_all_memberships" 
ON public.organization_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
      AND r.name = 'admin'
  )
);

-- Add comments
COMMENT ON POLICY "users_can_view_own_memberships" ON public.organization_members IS 'Users can view their own organization memberships';
COMMENT ON POLICY "org_admins_can_view_org_members" ON public.organization_members IS 'Organization admins can view all members of their organization';
COMMENT ON POLICY "org_admins_can_invite_members" ON public.organization_members IS 'Organization admins can invite new members';
COMMENT ON POLICY "users_can_update_own_membership" ON public.organization_members IS 'Users can update their own membership (accept/decline/leave)';
COMMENT ON POLICY "org_admins_can_update_org_members" ON public.organization_members IS 'Organization admins can update members of their organization';
COMMENT ON POLICY "org_admins_can_delete_org_members" ON public.organization_members IS 'Organization admins can remove members from their organization';
COMMENT ON POLICY "platform_admins_can_view_all_memberships" ON public.organization_members IS 'Platform admins can view all memberships';
COMMENT ON POLICY "platform_admins_can_manage_all_memberships" ON public.organization_members IS 'Platform admins have full access to all memberships';
