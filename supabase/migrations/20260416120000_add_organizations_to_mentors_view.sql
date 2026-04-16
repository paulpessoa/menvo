-- =================================================================
-- ADD ORGANIZATIONS TO MENTORS VIEW - Multi-Tenant System
-- Updates mentors view to include associated organization IDs for filtering
-- =================================================================

-- 1. Create a helper function to get organization IDs for a user
CREATE OR REPLACE FUNCTION public.get_user_organization_ids(user_uuid UUID)
RETURNS UUID[] AS $$
BEGIN
  RETURN (
    SELECT ARRAY_AGG(organization_id)
    FROM public.organization_members
    WHERE user_id = user_uuid
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update mentors_view
DROP VIEW IF EXISTS public.mentors_view CASCADE;

CREATE OR REPLACE VIEW public.mentors_view AS
SELECT 
  -- Core identity fields
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.full_name,
  p.bio,
  p.avatar_url,
  p.slug,
  p.verified,
  p.verified_at,
  p.created_at,
  p.updated_at,
  
  -- Professional fields
  p.job_title,
  p.job_title as current_position,
  p.company,
  p.company as current_company,
  p.experience_years,
  p.linkedin_url,
  p.github_url,
  p.twitter_url,
  p.website_url,
  
  -- Mentorship specific fields
  p.expertise_areas,
  p.expertise_areas as mentor_skills, -- Alias for API compatibility
  p.mentorship_topics,
  p.languages,
  p.inclusive_tags,
  p.inclusive_tags as inclusion_tags, -- Alias for API compatibility
  p.session_price_usd,
  p.availability_status,
  COALESCE(p.chat_enabled, false) as chat_enabled,
  
  -- Location fields
  p.city,
  p.state,
  p.country,
  COALESCE(p.city, '') as location, -- Alias for API compatibility
  p.timezone,
  
  -- Rating and session fields
  COALESCE(p.average_rating, 0) as rating,
  COALESCE(p.total_reviews, 0) as reviews,
  COALESCE(p.total_sessions, 0) as sessions,
  p.average_rating,
  p.total_reviews,
  p.total_sessions,
  
  -- Availability and status
  (p.availability_status = 'available') as is_available,
  60 as session_duration, -- Default session duration in minutes
  
  -- Role information
  ARRAY['mentor'] as active_roles, -- Always mentor for this view
  
  -- Contact fields
  p.phone,
  
  -- Demographics (optional)
  p.age,

  -- ORGANIZATION FIELDS
  COALESCE(
    (
      SELECT ARRAY_AGG(om.organization_id)
      FROM public.organization_members om
      WHERE om.user_id = p.id
        AND om.status = 'active'
    ), 
    '{}'::UUID[]
  ) as organization_ids

FROM public.profiles p
JOIN public.user_roles ur ON p.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
WHERE r.name = 'mentor' 
  AND p.verified = true  -- Must be verified by admin
  AND p.first_name IS NOT NULL  -- Must have first name
  AND p.last_name IS NOT NULL  -- Must have last name
  AND TRIM(p.first_name) != ''  -- First name must not be empty
  AND TRIM(p.last_name) != ''  -- Last name must not be empty
  AND p.bio IS NOT NULL  -- Must have bio
  AND LENGTH(TRIM(p.bio)) > 0;  -- Bio must not be empty

-- 3. Update mentors_admin_view
DROP VIEW IF EXISTS public.mentors_admin_view CASCADE;

CREATE OR REPLACE VIEW public.mentors_admin_view AS
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.full_name,
  p.bio,
  p.avatar_url,
  p.slug,
  p.verified,
  p.verified_at,
  p.created_at,
  p.updated_at,
  p.job_title,
  p.job_title as current_position,
  p.company,
  p.company as current_company,
  p.experience_years,
  p.linkedin_url,
  p.github_url,
  p.twitter_url,
  p.website_url,
  p.expertise_areas,
  p.expertise_areas as mentor_skills,
  p.mentorship_topics,
  p.languages,
  p.inclusive_tags,
  p.inclusive_tags as inclusion_tags,
  p.session_price_usd,
  p.availability_status,
  COALESCE(p.chat_enabled, false) as chat_enabled,
  p.city,
  p.state,
  p.country,
  COALESCE(p.city, '') as location,
  p.timezone,
  COALESCE(p.average_rating, 0) as rating,
  COALESCE(p.total_reviews, 0) as reviews,
  COALESCE(p.total_sessions, 0) as sessions,
  p.average_rating,
  p.total_reviews,
  p.total_sessions,
  (p.availability_status = 'available') as is_available,
  60 as session_duration,
  ARRAY['mentor'] as active_roles,
  p.phone,
  p.age,
  -- Additional admin fields
  CASE 
    WHEN p.verified = true THEN 'verified'
    WHEN p.first_name IS NULL OR p.last_name IS NULL OR 
         TRIM(p.first_name) = '' OR TRIM(p.last_name) = '' OR
         p.bio IS NULL OR LENGTH(TRIM(p.bio)) = 0 THEN 'incomplete_profile'
    ELSE 'pending_verification'
  END as profile_status,
  
  -- ORGANIZATION FIELDS
  COALESCE(
    (
      SELECT ARRAY_AGG(om.organization_id)
      FROM public.organization_members om
      WHERE om.user_id = p.id
        AND om.status = 'active'
    ), 
    '{}'::UUID[]
  ) as organization_ids

FROM public.profiles p
JOIN public.user_roles ur ON p.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
WHERE r.name = 'mentor';

-- Grant appropriate permissions
GRANT SELECT ON public.mentors_view TO anon, authenticated, service_role;
GRANT SELECT ON public.mentors_admin_view TO authenticated, service_role;

-- Add comment to clarify filtering
COMMENT ON COLUMN public.mentors_view.organization_ids IS 'Array of organization IDs the mentor belongs to with active status';
