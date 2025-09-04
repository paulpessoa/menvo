-- Configurar usuário admin
-- Criar perfil para paulmspessoa@gmail.com se não existir

DO $$
DECLARE
    admin_user_id UUID;
    admin_role_id INTEGER;
BEGIN
    -- Verificar se o usuário já existe
    SELECT id INTO admin_user_id 
    FROM public.profiles 
    WHERE email = 'paulmspessoa@gmail.com';
    
    -- Se não existe, criar um perfil básico
    IF admin_user_id IS NULL THEN
        admin_user_id := gen_random_uuid();
        
        INSERT INTO public.profiles (
            id, 
            email, 
            first_name, 
            last_name, 
            verified,
            created_at
        ) VALUES (
            admin_user_id,
            'paulmspessoa@gmail.com',
            'Paulo',
            'Pessoa',
            true,
            NOW()
        );
        
        RAISE NOTICE 'Perfil criado para paulmspessoa@gmail.com com ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Perfil já existe para paulmspessoa@gmail.com com ID: %', admin_user_id;
    END IF;
    
    -- Buscar o ID da role admin
    SELECT id INTO admin_role_id 
    FROM public.roles 
    WHERE name = 'admin';
    
    -- Se a role admin existe, atribuir ao usuário
    IF admin_role_id IS NOT NULL THEN
        -- Remover roles existentes
        DELETE FROM public.user_roles WHERE user_id = admin_user_id;
        
        -- Adicionar role admin
        INSERT INTO public.user_roles (user_id, role_id) 
        VALUES (admin_user_id, admin_role_id);
        
        RAISE NOTICE 'Role admin atribuída para paulmspessoa@gmail.com';
    ELSE
        RAISE NOTICE 'Role admin não encontrada';
    END IF;
END $$;

-- Verificar o resultado
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.verified,
    r.name as role,
    p.created_at
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
LEFT JOIN public.roles r ON ur.role_id = r.id
WHERE p.email = 'paulmspessoa@gmail.com';