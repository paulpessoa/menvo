-- 1. Remove a coluna física causadora do erro de tipagem
ALTER TABLE public.profiles DROP COLUMN IF EXISTS session_price_usd;

-- 2. Reconstroi a view de mentores com lista EXPLÍCITA (Garante compatibilidade e evita conflitos)
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
    -- Cargo e Empresa (Nomes reais e Aliases)
    p.job_title,
    p.job_title as current_position,
    p.company,
    p.company as current_company,
    -- Redes Sociais e Contato
    p.linkedin_url,
    p.github_url,
    p.twitter_url,
    p.website_url,
    p.portfolio_url,
    p.phone,
    -- Localização Individual
    p.city,
    p.state,
    p.country,
    p.address,
    p.timezone,
    -- Dados de Mentoria
    p.expertise_areas,
    p.mentorship_topics,
    p.free_topics,
    p.inclusive_tags,
    p.inclusive_tags as inclusion_tags,
    p.languages,
    -- Educação e Experiência
    p.academic_level as education_level,
    p.institution,
    p.course,
    p.expected_graduation,
    p.experience_years as years_experience,
    -- Status e Flags
    p.availability_status as availability,
    p.mentorship_approach,
    p.what_to_expect,
    p.ideal_mentee,
    p.cv_url,
    p.is_public,
    p.verified,
    p.verification_status,
    p.is_pending_mentor,
    -- LOCALIZAÇÃO FORMATADA (Sobrescreve a coluna p.location na View)
    COALESCE(p.city, '') || 
    CASE WHEN p.city IS NOT NULL AND p.state IS NOT NULL THEN ', ' ELSE '' END || COALESCE(p.state, '') ||
    CASE WHEN (p.city IS NOT NULL OR p.state IS NOT NULL) AND p.country IS NOT NULL THEN ', ' ELSE '' END || COALESCE(p.country, '') as location,
    -- Agregados
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
