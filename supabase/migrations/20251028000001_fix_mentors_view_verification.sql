-- Fix mentors_view to only show verified mentors with complete profiles
-- This ensures mentors must:
-- 1. Be verified by admin
-- 2. Have complete profile information (name, bio)

-- First, add verified_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN verified_at TIMESTAMPTZ;
    
    -- Set verified_at for already verified mentors
    UPDATE public.profiles 
    SET verified_at = updated_at 
    WHERE verified = true AND verified_at IS NULL;
  END IF;
END $$;

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
  AND p.verified = true  -- Must be verified by admin
  AND p.first_name IS NOT NULL  -- Must have first name
  AND p.last_name IS NOT NULL  -- Must have last name
  AND TRIM(p.first_name) != ''  -- First name must not be empty
  AND TRIM(p.last_name) != ''  -- Last name must not be empty
  AND p.bio IS NOT NULL  -- Must have bio
  AND LENGTH(TRIM(p.bio)) > 0;  -- Bio must not be empty

-- Create/update admin view for all mentors (for admin panel)
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
  p.age,
  -- Additional admin fields
  CASE 
    WHEN p.verified = true THEN 'verified'
    WHEN p.first_name IS NULL OR p.last_name IS NULL OR 
         TRIM(p.first_name) = '' OR TRIM(p.last_name) = '' OR
         p.bio IS NULL OR LENGTH(TRIM(p.bio)) = 0 THEN 'incomplete_profile'
    ELSE 'pending_verification'
  END as profile_status

FROM public.profiles p
JOIN public.user_roles ur ON p.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
WHERE r.name = 'mentor';

-- Add comments for documentation
COMMENT ON VIEW public.mentors_view IS 'Public view of verified mentors with complete profiles - safe for public consumption';
COMMENT ON VIEW public.mentors_admin_view IS 'Admin view of all mentors with profile status - for admin panel use';

-- Grant appropriate permissions
GRANT SELECT ON public.mentors_view TO anon, authenticated, service_role;
GRANT SELECT ON public.mentors_admin_view TO authenticated, service_role;
