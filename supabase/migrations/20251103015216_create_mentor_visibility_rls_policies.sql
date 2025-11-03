-- =================================================================
-- CREATE RLS POLICIES FOR MENTOR_VISIBILITY_SETTINGS TABLE - Multi-Tenant System
-- Row Level Security policies for mentor_visibility_settings table
-- =================================================================

-- Enable RLS on mentor_visibility_settings table
ALTER TABLE public.mentor_visibility_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Mentors can view and manage their own visibility settings
CREATE POLICY "mentors_can_manage_own_visibility" 
ON public.mentor_visibility_settings
FOR ALL
USING (mentor_id = auth.uid());

-- Policy: Organization admins can view visibility settings of their mentors
CREATE POLICY "org_admins_can_view_mentor_visibility" 
ON public.mentor_visibility_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.organization_members om
    WHERE om.user_id = mentor_id
      AND om.role = 'mentor'
      AND om.status = 'active'
      AND EXISTS (
        SELECT 1 
        FROM public.organization_members om2
        WHERE om2.organization_id = om.organization_id
          AND om2.user_id = auth.uid()
          AND om2.role = 'admin'
          AND om2.status = 'active'
      )
  )
);

-- Policy: Platform admins can view all visibility settings
CREATE POLICY "platform_admins_can_view_all_visibility" 
ON public.mentor_visibility_settings
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

-- Add comments
COMMENT ON POLICY "mentors_can_manage_own_visibility" ON public.mentor_visibility_settings IS 'Mentors have full control over their own visibility settings';
COMMENT ON POLICY "org_admins_can_view_mentor_visibility" ON public.mentor_visibility_settings IS 'Organization admins can view visibility settings of mentors in their organization';
COMMENT ON POLICY "platform_admins_can_view_all_visibility" ON public.mentor_visibility_settings IS 'Platform admins can view all visibility settings';
