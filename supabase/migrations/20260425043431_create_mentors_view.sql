-- RECONSTRUÇÃO ARQUITETURAL LIMPA (SINCRONIZADA COM O FRONT)
-- Esta View reflete fielmente a estrutura da tabela profiles, adicionando apenas
-- os agregados de agenda (availability) e localização (location) para o front.
DROP VIEW IF EXISTS public.mentors_view;

CREATE OR REPLACE VIEW public.mentors_view WITH (security_invoker = true) AS
SELECT 
    -- 1. Campos Reais (Identidade e Perfil)
    p.id, p.email, p.first_name, p.last_name, p.full_name, p.slug, p.bio, p.avatar_url,
    
    -- 2. Campos Reais (Profissional)
    p.job_title,
    p.company,
    p.experience_years,
    
    -- 3. Campos Reais (Redes Sociais e Contato)
    p.linkedin_url, p.github_url, p.twitter_url, p.website_url, p.portfolio_url, p.phone,
    
    -- 4. Campos Reais (Localização)
    p.city, p.state, p.country, p.address, p.timezone,
    
    -- 5. Campos Reais (Educação)
    p.academic_level, p.institution, p.course, p.expected_graduation,
    
    -- 6. Campos Reais (Mentoria e Tags)
    p.expertise_areas, p.mentorship_topics, p.free_topics, 
    p.inclusive_tags, p.languages,
    p.mentorship_approach, p.what_to_expect, p.ideal_mentee, p.mentorship_guidelines,
    
    -- 7. Campos Reais (Status e Flags)
    p.availability_status,
    p.verified, p.verification_status, p.is_pending_mentor,
    p.is_public, p.is_volunteer, p.chat_enabled, p.show_in_community, p.cv_url,
    
    -- 8. Campos Reais (Performance)
    p.average_rating, p.total_sessions, p.total_reviews,
    
    -- 9. CALCULADOS / AGREGADOS
    -- Agenda detalhada em JSON (availability)
    (
        SELECT jsonb_agg(jsonb_build_object(
            'day_of_week', ma.day_of_week,
            'start_time', ma.start_time,
            'end_time', ma.end_time,
            'timezone', ma.timezone
        ))
        FROM public.mentor_availability ma
        WHERE ma.mentor_id = p.id
    ) as availability,

    -- Localização formatada como string única
    COALESCE(p.city, '') || 
    CASE WHEN p.city IS NOT NULL AND p.state IS NOT NULL THEN ', ' ELSE '' END || COALESCE(p.state, '') ||
    CASE WHEN (p.city IS NOT NULL OR p.state IS NOT NULL) AND p.country IS NOT NULL THEN ', ' ELSE '' END || COALESCE(p.country, '') as location,
    
    -- Array unificado de habilidades
    (SELECT array_agg(DISTINCT skill) FROM unnest(array_cat(p.expertise_areas, p.mentorship_topics)) as skill WHERE skill IS NOT NULL) as mentor_skills,
    
    -- Metadados
    p.created_at, p.updated_at, p.origin_platform, p.external_id
FROM 
    public.profiles p
WHERE 
    EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.roles r ON ur.role_id = r.id WHERE ur.user_id = p.id AND r.name = 'mentor');
