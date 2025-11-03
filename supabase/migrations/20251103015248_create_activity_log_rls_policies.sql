-- =================================================================
-- CREATE RLS POLICIES FOR ORGANIZATION_ACTIVITY_LOG TABLE - Multi-Tenant System
-- Row Level Security policies for organization_activity_log table
-- =================================================================

-- Enable RLS on organization_activity_log table
ALTER TABLE public.organization_activity_log ENABLE ROW LEVEL SECURITY;

-- Policy: Organization admins can view activity log of their organization
CREATE POLICY "org_admins_can_view_activity_log" 
ON public.organization_activity_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.organization_members om
    WHERE om.organization_id = organization_activity_log.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
      AND om.status = 'active'
  )
);

-- Policy: Platform admins can view all activity logs
CREATE POLICY "platform_admins_can_view_all_activity_logs" 
ON public.organization_activity_log
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

-- Note: No INSERT policy for users - activity logs are created by system/service role only
-- This ensures audit trail integrity

-- Add comments
COMMENT ON POLICY "org_admins_can_view_activity_log" ON public.organization_activity_log IS 'Organization admins can view activity logs of their organization';
COMMENT ON POLICY "platform_admins_can_view_all_activity_logs" ON public.organization_activity_log IS 'Platform admins can view all activity logs';
