-- Add mentor role to admin user and setup mentor profile
-- User ID: 0737122a-0579-4981-9802-41883d6563a3

DO $$
DECLARE
    admin_user_id UUID := '0737122a-0579-4981-9802-41883d6563a3';
    mentor_role_id INTEGER;
BEGIN
    -- Get mentor role ID
    SELECT id INTO mentor_role_id 
    FROM public.roles 
    WHERE name = 'mentor';
    
    -- Check if mentor role exists
    IF mentor_role_id IS NULL THEN
        RAISE EXCEPTION 'Mentor role not found';
    END IF;
    
    -- Add mentor role to admin user (if not already exists)
    INSERT INTO public.user_roles (user_id, role_id, assigned_at)
    VALUES (admin_user_id, mentor_role_id, NOW())
    ON CONFLICT (user_id, role_id) DO NOTHING;
    
    -- Update admin user profile with mentor-specific information
    UPDATE public.profiles 
    SET 
        bio = COALESCE(bio, 'Administrador e mentor da plataforma Menvo. Especialista em desenvolvimento de software, gestão de produtos e mentoria técnica. Ajudo profissionais a crescer na carreira tech.'),
        expertise_areas = COALESCE(expertise_areas, ARRAY[
            'Desenvolvimento Web',
            'JavaScript',
            'React',
            'Node.js',
            'Gestão de Produtos',
            'Mentoria Técnica',
            'Carreira em Tech',
            'Empreendedorismo'
        ]),
        mentorship_topics = COALESCE(mentorship_topics, ARRAY[
            'Desenvolvimento Frontend',
            'Desenvolvimento Backend',
            'Gestão de Produtos',
            'Carreira em Tecnologia',
            'Liderança Técnica'
        ]),
        job_title = COALESCE(job_title, 'Founder & Tech Lead'),
        company = COALESCE(company, 'Menvo'),
        experience_years = COALESCE(experience_years, 10),
        session_price_usd = COALESCE(session_price_usd, 0.00), -- Free sessions for admin
        availability_status = COALESCE(availability_status, 'available'),
        verified = true, -- Auto-verify admin as mentor
        updated_at = NOW()
    WHERE id = admin_user_id;
    
    -- Log the action
    RAISE NOTICE 'Admin user % has been assigned mentor role and profile updated', admin_user_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding mentor role to admin: %', SQLERRM;
END $$;

-- Verify the result
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.verified,
    p.bio,
    p.expertise_areas,
    p.mentorship_topics,
    ARRAY_AGG(r.name) as roles
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
LEFT JOIN public.roles r ON ur.role_id = r.id
WHERE p.id = '0737122a-0579-4981-9802-41883d6563a3'
GROUP BY p.id, p.email, p.first_name, p.last_name, p.verified, p.bio, p.expertise_areas, p.mentorship_topics;