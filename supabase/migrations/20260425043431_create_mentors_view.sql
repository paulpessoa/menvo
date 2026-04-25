-- Remove a view antiga para reconstruir com todas as colunas e aliases de compatibilidade
DROP VIEW IF EXISTS public.mentors_view;

CREATE OR REPLACE VIEW public.mentors_view WITH (security_invoker = true) AS
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.full_name,
    p.slug,
    p.bio,
    p.avatar_url,
    p.job_title,
    p.job_title as current_position, -- Alias para compatibilidade
    p.company as current_company,
    p.linkedin_url,
    p.github_url,
    p.twitter_url,
    p.website_url,
    p.portfolio_url,
    p.phone,
    p.city,
    p.state,
    p.country,
    p.address,
    p.timezone,
    p.age,
    p.expertise_areas,
    p.mentorship_topics,
    p.free_topics,
    p.inclusive_tags,
    p.inclusive_tags as inclusion_tags, -- Alias para compatibilidade
    p.languages,
    p.academic_level as education_level,
    p.institution,
    p.course,
    p.expected_graduation,
    p.experience_years as years_experience,
    p.availability_status as availability,
    p.mentorship_approach,
    p.what_to_expect,
    p.ideal_mentee,
    p.cv_url,
    p.is_public,
    p.verified,
    p.verification_status,
    p.is_pending_mentor,
    -- Localização formatada como string única
    COALESCE(p.city, '') || 
    CASE WHEN p.city IS NOT NULL AND p.state IS NOT NULL THEN ', ' ELSE '' END || COALESCE(p.state, '') ||
    CASE WHEN (p.city IS NOT NULL OR p.state IS NOT NULL) AND p.country IS NOT NULL THEN ', ' ELSE '' END || COALESCE(p.country, '') as location,
    (
        SELECT array_agg(DISTINCT skill)
        FROM unnest(array_cat(p.expertise_areas, p.mentorship_topics)) as skill
        WHERE skill IS NOT NULL
    ) as mentor_skills,
    (
        SELECT array_agg(r.name)
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = p.id
    ) as active_roles,
    COALESCE(p.average_rating, 0) as rating,
    COALESCE(p.total_sessions, 0) as sessions,
    COALESCE(p.total_reviews, 0) as reviews,
    p.created_at,
    p.updated_at
FROM 
    public.profiles p
WHERE 
    EXISTS (
        SELECT 1 
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = p.id AND r.name = 'mentor'
    );
