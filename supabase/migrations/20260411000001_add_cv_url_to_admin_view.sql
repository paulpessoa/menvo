-- Atualizar mentors_admin_view para incluir cv_url
CREATE OR REPLACE VIEW public.mentors_admin_view AS
 SELECT p.id,
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
    p.job_title AS current_position,
    p.company AS current_company,
    p.experience_years,
    p.linkedin_url,
    p.github_url,
    p.twitter_url,
    p.website_url,
    p.cv_url,
    p.expertise_areas,
    p.expertise_areas AS mentor_skills,
    p.mentorship_topics,
    p.languages,
    p.inclusive_tags,
    p.inclusive_tags AS inclusion_tags,
    p.session_price_usd,
    p.availability_status,
    p.city,
    p.state,
    p.country,
    COALESCE(p.city, ''::text) AS location,
    p.timezone,
    COALESCE(p.average_rating, (0)::numeric) AS rating,
    COALESCE(p.total_reviews, 0) AS reviews,
    COALESCE(p.total_sessions, 0) AS sessions,
    p.average_rating,
    p.total_reviews,
    p.total_sessions,
    (p.availability_status = 'available'::text) AS is_available,
    60 AS session_duration,
    ARRAY['mentor'::text] AS active_roles,
    p.phone,
    p.age,
        CASE
            WHEN (p.verified = true) THEN 'verified'::text
            WHEN ((p.first_name IS NULL) OR (p.last_name IS NULL) OR (TRIM(BOTH FROM p.first_name) = ''::text) OR (TRIM(BOTH FROM p.last_name) = ''::text) OR (p.bio IS NULL) OR (length(TRIM(BOTH FROM p.bio)) = 0)) THEN 'incomplete_profile'::text
            ELSE 'pending_verification'::text
        END AS profile_status
   FROM ((profiles p
     JOIN user_roles ur ON ((p.id = ur.user_id)))
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE (r.name = 'mentor'::text);

GRANT SELECT ON public.mentors_admin_view TO authenticated, service_role;
