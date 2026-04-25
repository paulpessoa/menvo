-- Configura roles específicas para usuários selecionados
DO $$
DECLARE
    admin_id UUID;
    mentor_id UUID;
    mentee_id UUID;
    admin_role_id INT;
    mentor_role_id INT;
    mentee_role_id INT;
BEGIN
    -- 1. Garantir que as roles existem com IDs numéricos (ID 1=admin, 2=mentee, 3=mentor)
    INSERT INTO public.roles (id, name) VALUES (1, 'admin'), (2, 'mentee'), (3, 'mentor') ON CONFLICT (id) DO NOTHING;
    
    SELECT id INTO admin_role_id FROM public.roles WHERE name = 'admin';
    SELECT id INTO mentor_role_id FROM public.roles WHERE name = 'mentor';
    SELECT id INTO mentee_role_id FROM public.roles WHERE name = 'mentee';

    -- 2. Buscar IDs dos usuários pelo email (no schema auth)
    SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@menvo.com.br';
    SELECT id INTO mentor_id FROM auth.users WHERE email = 'paulmspessoa@gmail.com';
    SELECT id INTO mentee_id FROM auth.users WHERE email = 'mccartney.shalom@gmail.com';

    -- 3. Configurar ADMIN (admin@menvo.com.br)
    IF admin_id IS NOT NULL THEN
        -- Limpa roles antigas e define como admin
        DELETE FROM public.user_roles WHERE user_id = admin_id;
        INSERT INTO public.user_roles (user_id, role_id) VALUES (admin_id, admin_role_id);
        
        -- Atualiza profile para refletir status
        UPDATE public.profiles SET verified = true, is_public = true WHERE id = admin_id;
    END IF;

    -- 4. Configurar MENTOR (paulmspessoa@gmail.com)
    IF mentor_id IS NOT NULL THEN
        -- Adiciona role de mentor (mantendo outras se houver, ou limpando para garantir)
        DELETE FROM public.user_roles WHERE user_id = mentor_id;
        INSERT INTO public.user_roles (user_id, role_id) VALUES (mentor_id, mentor_role_id);
        
        -- Atualiza profile para mentor ativo
        UPDATE public.profiles 
        SET verified = true, 
            is_public = true, 
            verification_status = 'approved',
            is_pending_mentor = false
        WHERE id = mentor_id;
    END IF;

    -- 5. Configurar MENTEE (mccartney.shalom@gmail.com)
    IF mentee_id IS NOT NULL THEN
        DELETE FROM public.user_roles WHERE user_id = mentee_id;
        INSERT INTO public.user_roles (user_id, role_id) VALUES (mentee_id, mentee_role_id);
    END IF;

END $$;
