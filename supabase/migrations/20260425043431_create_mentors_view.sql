-- RECONSTRUÇÃO DEFINITIVA DA VIEW DE MENTORES (STAFF APPROVED)
-- Resolve erros de: inclusion_tags, job_title, session_price_usd e availability_status
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
    -- Cargo e Empresa (Aliases Totais para compatibilidade)
    p.job_title,
    p.job_title as current_position,
    p.company,
    p.company as current_company,
    -- Redes Sociais
    p.linkedin_url,
    p.github_url,
    p.twitter_url,
    p.website_url,
    p.portfolio_url,
    -- Localização Individual
    p.city,
    p.state,
    p.country,
    p.address,
    p.timezone,
    -- Dados de Mentoria e Tags (Aliases Totais)
    p.expertise_areas,
    p.mentorship_topics,
    p.free_topics,
    p.inclusive_tags,
    p.inclusive_tags as inclusion_tags,
    p.languages,
    -- Disponibilidade (Aliases Totais)
    p.availability_status,
    p.availability_status as availability,
    -- Educação e Experiência
    p.academic_level as education_level,
    p.institution,
    p.course,
    p.expected_graduation,
    p.experience_years as years_experience,
    -- Status e Verificação
    p.verified,
    p.verification_status,
    p.is_pending_mentor,
    p.is_public,
    -- Localização formatada
    COALESCE(p.city, '') || 
    CASE WHEN p.city IS NOT NULL AND p.state IS NOT NULL THEN ', ' ELSE '' END || COALESCE(p.state, '') ||
    CASE WHEN (p.city IS NOT NULL OR p.state IS NOT NULL) AND p.country IS NOT NULL THEN ', ' ELSE '' END || COALESCE(p.country, '') as location,
    -- Agregados de Performance
    (SELECT array_agg(DISTINCT skill) FROM unnest(array_cat(p.expertise_areas, p.mentorship_topics)) as skill WHERE skill IS NOT NULL) as mentor_skills,
    COALESCE(p.average_rating, 0) as rating,
    COALESCE(p.total_sessions, 0) as sessions,
    COALESCE(p.total_reviews, 0) as reviews,
    p.created_at,
    p.updated_at
FROM 
    public.profiles p
WHERE 
    EXISTS (
        SELECT 1 FROM public.user_roles ur 
        JOIN public.roles r ON ur.role_id = r.id 
        WHERE ur.user_id = p.id AND r.name = 'mentor'
    );
