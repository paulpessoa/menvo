-- Script para definir usuário admin
DO $$
BEGIN
    -- Inserir ou atualizar o usuário admin
    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        full_name,
        role,
        status,
        verification_status,
        created_at,
        updated_at
    ) VALUES (
        (SELECT id FROM auth.users WHERE email = 'paulmspessoa@gmail.com' LIMIT 1),
        'paulmspessoa@gmail.com',
        'Paulo',
        'Pessoa',
        'Paulo Pessoa',
        'admin'::user_role,
        'active'::user_status,
        'verified'::verification_status,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'admin'::user_role,
        status = 'active'::user_status,
        verification_status = 'verified'::verification_status,
        updated_at = NOW();
        
    -- Se o usuário não existir no auth.users, criar um registro temporário
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'paulmspessoa@gmail.com') THEN
        RAISE NOTICE 'Usuário paulmspessoa@gmail.com não encontrado no auth.users. Crie a conta primeiro.';
    END IF;
END $$;
