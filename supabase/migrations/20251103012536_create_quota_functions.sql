-- =================================================================
-- CREATE QUOTA FUNCTIONS - Multi-Tenant System
-- Functions for checking organization quotas (mentors, mentees, appointments)
-- =================================================================

-- Function to check if organization has reached quota limit
CREATE OR REPLACE FUNCTION public.check_organization_quota(
  org_id UUID,
  quota_type TEXT -- 'mentors', 'mentees', 'monthly_appointments'
) RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Get quota limit for the specified type
  IF quota_type = 'mentors' THEN
    SELECT max_mentors INTO max_allowed
    FROM public.organizations
    WHERE id = org_id;
    
  ELSIF quota_type = 'mentees' THEN
    SELECT max_mentees INTO max_allowed
    FROM public.organizations
    WHERE id = org_id;
    
  ELSIF quota_type = 'monthly_appointments' THEN
    SELECT max_monthly_appointments INTO max_allowed
    FROM public.organizations
    WHERE id = org_id;
    
  ELSE
    RAISE EXCEPTION 'Invalid quota_type: %. Must be mentors, mentees, or monthly_appointments', quota_type;
  END IF;
  
  -- NULL means unlimited
  IF max_allowed IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Count current usage based on quota type
  IF quota_type = 'mentors' THEN
    SELECT COUNT(*) INTO current_count
    FROM public.organization_members
    WHERE organization_id = org_id 
      AND role = 'mentor' 
      AND status = 'active';
    
  ELSIF quota_type = 'mentees' THEN
    SELECT COUNT(*) INTO current_count
    FROM public.organization_members
    WHERE organization_id = org_id 
      AND role = 'mentee' 
      AND status = 'active';
    
  ELSIF quota_type = 'monthly_appointments' THEN
    SELECT COUNT(*) INTO current_count
    FROM public.appointments
    WHERE organization_id = org_id 
      AND scheduled_at >= date_trunc('month', NOW())
      AND scheduled_at < date_trunc('month', NOW()) + INTERVAL '1 month';
  END IF;
  
  -- Return TRUE if under quota, FALSE if at or over quota
  RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current usage and limits for an organization
CREATE OR REPLACE FUNCTION public.get_organization_quota_usage(org_id UUID)
RETURNS TABLE(
  quota_type TEXT,
  current_usage INTEGER,
  max_limit INTEGER,
  is_unlimited BOOLEAN,
  percentage_used NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH org_data AS (
    SELECT 
      o.max_mentors,
      o.max_mentees,
      o.max_monthly_appointments
    FROM public.organizations o
    WHERE o.id = org_id
  ),
  usage_data AS (
    SELECT
      COUNT(*) FILTER (WHERE om.role = 'mentor' AND om.status = 'active') AS mentor_count,
      COUNT(*) FILTER (WHERE om.role = 'mentee' AND om.status = 'active') AS mentee_count
    FROM public.organization_members om
    WHERE om.organization_id = org_id
  ),
  appointment_data AS (
    SELECT COUNT(*) AS appointment_count
    FROM public.appointments a
    WHERE a.organization_id = org_id
      AND a.scheduled_at >= date_trunc('month', NOW())
      AND a.scheduled_at < date_trunc('month', NOW()) + INTERVAL '1 month'
  )
  SELECT 
    'mentors'::TEXT,
    usage_data.mentor_count::INTEGER,
    org_data.max_mentors,
    (org_data.max_mentors IS NULL)::BOOLEAN,
    CASE 
      WHEN org_data.max_mentors IS NULL THEN 0
      WHEN org_data.max_mentors = 0 THEN 100
      ELSE ROUND((usage_data.mentor_count::NUMERIC / org_data.max_mentors::NUMERIC) * 100, 2)
    END
  FROM org_data, usage_data
  
  UNION ALL
  
  SELECT 
    'mentees'::TEXT,
    usage_data.mentee_count::INTEGER,
    org_data.max_mentees,
    (org_data.max_mentees IS NULL)::BOOLEAN,
    CASE 
      WHEN org_data.max_mentees IS NULL THEN 0
      WHEN org_data.max_mentees = 0 THEN 100
      ELSE ROUND((usage_data.mentee_count::NUMERIC / org_data.max_mentees::NUMERIC) * 100, 2)
    END
  FROM org_data, usage_data
  
  UNION ALL
  
  SELECT 
    'monthly_appointments'::TEXT,
    appointment_data.appointment_count::INTEGER,
    org_data.max_monthly_appointments,
    (org_data.max_monthly_appointments IS NULL)::BOOLEAN,
    CASE 
      WHEN org_data.max_monthly_appointments IS NULL THEN 0
      WHEN org_data.max_monthly_appointments = 0 THEN 100
      ELSE ROUND((appointment_data.appointment_count::NUMERIC / org_data.max_monthly_appointments::NUMERIC) * 100, 2)
    END
  FROM org_data, appointment_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION public.check_organization_quota IS 'Checks if organization has available quota for the specified type (mentors, mentees, monthly_appointments)';
COMMENT ON FUNCTION public.get_organization_quota_usage IS 'Returns current usage and limits for all quota types of an organization';
