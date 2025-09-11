-- Fix view permissions - mentors_view should be publicly accessible for verified mentors
-- Keep security_invoker but ensure public access works

-- Update mentors_view to be accessible by anon users (public mentor listing)
DROP VIEW IF EXISTS public.mentors_view;
CREATE VIEW public.mentors_view AS
SELECT 
  p.id, p.email, p.first_name, p.last_name, p.full_name, p.bio, p.avatar_url, p.slug, p.verified, p.created_at, p.updated_at,
  p.job_title as current_position, p.company as current_company, p.experience_years, p.linkedin_url, p.github_url, p.twitter_url, p.website_url,
  p.expertise_areas, p.expertise_areas as mentor_skills, p.mentorship_topics, p.languages, p.inclusive_tags, p.inclusive_tags as inclusion_tags,
  p.session_price_usd, p.availability_status, p.city, p.state, p.country, COALESCE(p.city, '') as location, p.timezone,
  COALESCE(p.average_rating, 0) as rating, COALESCE(p.total_reviews, 0) as reviews, COALESCE(p.total_sessions, 0) as sessions,
  p.average_rating, p.total_reviews, p.total_sessions, (p.availability_status = 'available') as is_available,
  60 as session_duration, ARRAY['mentor'] as active_roles, p.phone, p.age
FROM public.profiles p
JOIN public.user_roles ur ON p.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
WHERE r.name = 'mentor' AND p.verified = true;

-- Keep admin view with security_invoker for proper RLS
DROP VIEW IF EXISTS public.mentors_admin_view;
CREATE VIEW public.mentors_admin_view 
WITH (security_invoker = true) AS
SELECT 
  p.id, p.email, p.first_name, p.last_name, p.full_name, p.bio, p.avatar_url, p.slug, p.verified, p.created_at, p.updated_at,
  p.job_title as current_position, p.company as current_company, p.experience_years, p.linkedin_url, p.github_url, p.twitter_url, p.website_url,
  p.expertise_areas, p.expertise_areas as mentor_skills, p.mentorship_topics, p.languages, p.inclusive_tags, p.inclusive_tags as inclusion_tags,
  p.session_price_usd, p.availability_status, p.city, p.state, p.country, COALESCE(p.city, '') as location, p.timezone,
  COALESCE(p.average_rating, 0) as rating, COALESCE(p.total_reviews, 0) as reviews, COALESCE(p.total_sessions, 0) as sessions,
  p.average_rating, p.total_reviews, p.total_sessions, (p.availability_status = 'available') as is_available,
  60 as session_duration, ARRAY['mentor'] as active_roles, p.phone, p.age
FROM public.profiles p
JOIN public.user_roles ur ON p.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
WHERE r.name = 'mentor';

-- Grant permissions
GRANT SELECT ON public.mentors_view TO anon, authenticated, service_role;
GRANT SELECT ON public.mentors_admin_view TO authenticated, service_role;