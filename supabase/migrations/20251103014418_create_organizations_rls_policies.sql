-- =================================================================
-- CREATE RLS POLICIES FOR ORGANIZATIONS TABLE - Multi-Tenant System
-- Row Level Security policies for organizations table
-- =================================================================

-- Enable RLS on organizations table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active organizations
CREATE POLICY "public_can_view_active_organizations" 
ON public.organizations
FOR SELECT
USING (status = 'active');

-- Policy: Organization admins can view their organizations (any status)
CREATE POLICY "org_admins_can_view_own_organization" 
ON public.organizations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.organization_members om
    WHERE om.organization_id = id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
      AND om.status = 'active'
  )
);

-- Policy: Authenticated users can create organizations
CREATE POLICY "authenticated_users_can_create_organizations" 
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Organization admins can update their organizations
CREATE POLICY "org_admins_can_update_own_organization" 
ON public.organizations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM public.organization_members om
    WHERE om.organization_id = id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
      AND om.status = 'active'
  )
);

-- Policy: Platform admins can view all organizations
CREATE POLICY "platform_admins_can_view_all_organizations" 
ON public.organizations
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

-- Policy: Platform admins can update any organization
CREATE POLICY "platform_admins_can_update_any_organization" 
ON public.organizations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
      AND r.name = 'admin'
  )
);

-- Policy: Platform admins can delete organizations
CREATE POLICY "platform_admins_can_delete_organizations" 
ON public.organizations
FOR DELETE
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
COMMENT ON POLICY "public_can_view_active_organizations" ON public.organizations IS 'Anyone can view active organizations';
COMMENT ON POLICY "org_admins_can_view_own_organization" ON public.organizations IS 'Organization admins can view their own organization regardless of status';
COMMENT ON POLICY "authenticated_users_can_create_organizations" ON public.organizations IS 'Any authenticated user can create an organization';
COMMENT ON POLICY "org_admins_can_update_own_organization" ON public.organizations IS 'Organization admins can update their organization';
COMMENT ON POLICY "platform_admins_can_view_all_organizations" ON public.organizations IS 'Platform admins can view all organizations';
COMMENT ON POLICY "platform_admins_can_update_any_organization" ON public.organizations IS 'Platform admins can update any organization';
COMMENT ON POLICY "platform_admins_can_delete_organizations" ON public.organizations IS 'Platform admins can delete organizations';
