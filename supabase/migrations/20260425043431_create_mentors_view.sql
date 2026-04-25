-- RECONSTRUÇÃO DEFINITIVA E SINCRONIZADA DA VIEW DE MENTORES (STAFF APPROVED)
-- Alinhada com as mudanças de nomenclatura do frontend (abril/2026)
DROP VIEW IF EXISTS public.mentors_view;

CREATE OR REPLACE VIEW public.mentors_view WITH (security_invoker = true) AS
SELECT 
    -- 1. Campos Originais (Nomes reais da tabela profiles)
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.full_name,
    p.slug,
    p.bio,
    p.avatar_url,
    p.job_title,
    p.company,
    p.experience_years,
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
    p.academic_level,
    p.institution,
    p.course,
    p.expected_graduation,
    p.expertise_areas,
    p.mentorship_topics,
    p.free_topics,
    p.inclusive_tags,
    p.languages,
    p.mentorship_approach,
    p.what_to_expect,
    p.ideal_mentee,
    p.mentorship_guidelines,
    p.availability_status,
    p.verified,
    p.verification_status,
    p.is_pending_mentor,
    p.is_public,
    p.is_volunteer,
    p.chat_enabled,
    p.show_in_community,
    p.cv_url,
    p.average_rating,
    p.total_sessions,
    p.total_reviews,
    p.created_at,
    p.updated_at,
    p.origin_platform,
    p.external_id,

    -- 2. Aliases Estratégicos (Mantidos para compatibilidade com queries dinâmicas/filtros)
    p.inclusive_tags as inclusion_tags,
    COALESCE(p.city, '') || 
    CASE WHEN p.city IS NOT NULL AND p.state IS NOT NULL THEN ', ' ELSE '' END || COALESCE(p.state, '') ||
    CASE WHEN (p.city IS NOT NULL OR p.state IS NOT NULL) AND p.country IS NOT NULL THEN ', ' ELSE '' END || COALESCE(p.country, '') as location,
    
    -- 3. Agregados
    (
        SELECT array_agg(DISTINCT skill)
        FROM unnest(array_cat(p.expertise_areas, p.mentorship_topics)) as skill
        WHERE skill IS NOT NULL
    ) as mentor_skills
FROM 
    public.profiles p
WHERE 
    EXISTS (
        SELECT 1 FROM public.user_roles ur 
        JOIN public.roles r ON ur.role_id = r.id 
        WHERE ur.user_id = p.id AND r.name = 'mentor'
    );
