-- Add chat_enabled to mentors_view
-- This updates the view to include the new chat_enabled column from profiles

DROP VIEW IF EXISTS public.mentors_view;

CREATE OR REPLACE VIEW public.mentors_view AS
SELECT 
  p.id,
  p.full_name,
  p.avatar_url,
  p.bio,
  p.job_title as current_position,
  p.company as current_company,
  p.city,
  p.state,
  p.country,
  p.languages,
  p.mentorship_topics,
  p.inclusive_tags as inclusion_tags,
  p.expertise_areas,
  p.session_price_usd,
  p.availability_status,
  p.chat_enabled,
  p.average_rating as rating,
  p.total_reviews as reviews,
  p.total_sessions as sessions,
  p.experience_years,
  p.linkedin_url,
  p.github_url,
  p.twitter_url,
  p.website_url,
  p.timezone,
  p.slug
FROM public.profiles p
INNER JOIN public.user_roles ur ON p.id = ur.user_id
INNER JOIN public.roles r ON ur.role_id = r.id
WHERE r.name = 'mentor';

-- Grant access to the view
GRANT SELECT ON public.mentors_view TO authenticated;
GRANT SELECT ON public.mentors_view TO anon;

COMMENT ON VIEW public.mentors_view IS 'View of mentors with chat_enabled field included';
