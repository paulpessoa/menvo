-- Update mentors_view to only show verified mentors by default
-- This ensures public safety and follows the existing security model

DROP VIEW IF EXISTS public.mentors_view;

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
  p.created_at,
  p.updated_at,
  
  -- Professional fields
  p.job_title as current_position,
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
  p.age

FROM public.profiles p
JOIN public.user_roles ur ON p.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
WHERE r.name = 'mentor' 
  AND p.verified = true; -- Only show verified mentors

-- Create a separate view for admin use that shows all mentors (verified and unverified)
CREATE OR REPLACE VIEW public.mentors_admin_view AS
SELECT 
  -- Same fields as mentors_view but without verification filter
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.full_name,
  p.bio,
  p.avatar_url,
  p.slug,
  p.verified,
  p.created_at,
  p.updated_at,
  p.job_title as current_position,
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
  p.age

FROM public.profiles p
JOIN public.user_roles ur ON p.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
WHERE r.name = 'mentor'; -- Shows all mentors regardless of verification

-- Add comments for documentation
COMMENT ON VIEW public.mentors_view IS 'Public view of verified mentors only - safe for public consumption';
COMMENT ON VIEW public.mentors_admin_view IS 'Admin view of all mentors (verified and unverified) - for admin panel use';

-- Grant appropriate permissions
GRANT SELECT ON public.mentors_view TO anon, authenticated, service_role;
GRANT SELECT ON public.mentors_admin_view TO authenticated, service_role;

-- Note: Views inherit security from underlying tables
-- The mentors_admin_view will be secured through application-level access control