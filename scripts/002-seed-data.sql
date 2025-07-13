-- =================================================================
-- MENVO - SCRIPT DE SEEDING
-- Este script insere dados iniciais para teste e demonstração.
-- Execute APÓS o 001-initial-schema.sql
-- =================================================================

-- NOTA: A senha para todos os usuários criados aqui é "role123".
-- Crie-os manualmente no dashboard do Supabase ou via API com esta senha.

DO $$
DECLARE
    admin_user_id UUID;
    mentee_user_id UUID;
    volunteer_user_id UUID;
    moderator_user_id UUID;
BEGIN
    -- Criar usuários no `auth.users` e obter seus IDs
    -- A função `auth.admin.createUser` não está disponível em SQL,
    -- então inserimos diretamente. Isso é apenas para seeding.
    
    -- Admin
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
    VALUES (gen_random_uuid(), 'admin@menvo.com.br', crypt('role123', gen_salt('bf')), NOW(), '{"full_name": "Admin User", "user_type": "admin"}')
    RETURNING id INTO admin_user_id;
    UPDATE public.profiles SET role = 'admin', status = 'active', verification_status = 'verified' WHERE email = 'admin@menvo.com.br';

    -- Mentee
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
    VALUES (gen_random_uuid(), 'mentee@menvo.com.br', crypt('role123', gen_salt('bf')), NOW(), '{"full_name": "Mentee User", "user_type": "mentee"}')
    RETURNING id INTO mentee_user_id;
    UPDATE public.profiles SET role = 'mentee', status = 'active', verification_status = 'verified' WHERE email = 'mentee@menvo.com.br';

    -- Volunteer
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
    VALUES (gen_random_uuid(), 'volunteer@menvo.com.br', crypt('role123', gen_salt('bf')), NOW(), '{"full_name": "Volunteer User", "user_type": "volunteer"}')
    RETURNING id INTO volunteer_user_id;
    UPDATE public.profiles SET role = 'volunteer', status = 'active', verification_status = 'verified' WHERE email = 'volunteer@menvo.com.br';

    -- Moderator
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
    VALUES (gen_random_uuid(), 'moderator@menvo.com.br', crypt('role123', gen_salt('bf')), NOW(), '{"full_name": "Moderator User", "user_type": "moderator"}')
    RETURNING id INTO moderator_user_id;
    UPDATE public.profiles SET role = 'moderator', status = 'active', verification_status = 'verified' WHERE email = 'moderator@menvo.com.br';

    -- 5 Mentores Validados
    FOR i IN 1..5 LOOP
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
        VALUES (
            gen_random_uuid(),
            'mentor.validated.' || i || '@menvo.com.br',
            crypt('role123', gen_salt('bf')),
            NOW(),
            '{"full_name": "Validated Mentor ' || i || '", "user_type": "mentor"}'
        );
        UPDATE public.profiles 
        SET 
            role = 'mentor', 
            status = 'active', 
            verification_status = 'verified',
            bio = 'Experienced professional in tech and leadership, ready to help you grow.',
            expertise_areas = '["Software Development", "Career Growth", "Leadership"]'
        WHERE email = 'mentor.validated.' || i || '@menvo.com.br';
    END LOOP;

    -- 5 Mentores Pendentes
    FOR i IN 1..5 LOOP
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
        VALUES (
            gen_random_uuid(),
            'mentor.pending.' || i || '@menvo.com.br',
            crypt('role123', gen_salt('bf')),
            NOW(),
            '{"full_name": "Pending Mentor ' || i || '", "user_type": "mentor"}'
        );
        UPDATE public.profiles 
        SET 
            role = 'mentor', 
            status = 'pending', 
            verification_status = 'pending',
            bio = 'Aspiring mentor looking to share my journey with others.',
            expertise_areas = '["Startups", "Product Management"]'
        WHERE email = 'mentor.pending.' || i || '@menvo.com.br';
    END LOOP;

END $$;
