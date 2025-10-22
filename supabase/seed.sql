-- Seed data para desenvolvimento local
-- Cria usuários de teste no auth.users e habilita chat

DO $$
DECLARE
  profile_count INTEGER;
  mentor_role_id INTEGER;
  mentee_role_id INTEGER;
  updated_count INTEGER;
  test_user_id UUID;
  test_mentor_id UUID;
BEGIN
  -- Contar perfis existentes
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  RAISE NOTICE 'Perfis existentes: %', profile_count;
  
  -- Buscar IDs das roles
  SELECT id INTO mentor_role_id FROM public.roles WHERE name = 'mentor';
  SELECT id INTO mentee_role_id FROM public.roles WHERE name = 'mentee';
  
  -- Criar usuário de teste (mentee) no auth.users
  -- Verificar se já existe
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'teste@menvo.com';
  
  IF test_user_id IS NULL THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'teste@menvo.com',
      crypt('senha123', gen_salt('bf')),
      NOW(),
      '',
      '',
      '',
      '',
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Usuário Teste"}',
      false,
      'authenticated',
      'authenticated'
    )
    RETURNING id INTO test_user_id;
  END IF;
  
  -- Criar perfil para o usuário de teste se foi criado
  IF test_user_id IS NOT NULL THEN
    -- Verificar se o perfil já existe
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = test_user_id) THEN
      INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        verified,
        created_at,
        updated_at
      ) VALUES (
        test_user_id,
        'teste@menvo.com',
        'Usuário',
        'Teste',
        true,
        NOW(),
        NOW()
      );
    END IF;
    
    -- Adicionar role de mentee
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (test_user_id, mentee_role_id)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Usuário de teste criado: teste@menvo.com / senha123';
  END IF;
  
  -- Criar um mentor de teste no auth.users
  -- Verificar se já existe
  SELECT id INTO test_mentor_id FROM auth.users WHERE email = 'mentor@menvo.com';
  
  IF test_mentor_id IS NULL THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'mentor@menvo.com',
      crypt('senha123', gen_salt('bf')),
      NOW(),
      '',
      '',
      '',
      '',
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Mentor Teste"}',
      false,
      'authenticated',
      'authenticated'
    )
    RETURNING id INTO test_mentor_id;
  END IF;
  
  -- Criar perfil para o mentor de teste
  IF test_mentor_id IS NOT NULL THEN
    -- Verificar se o perfil já existe
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = test_mentor_id) THEN
      INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        bio,
        expertise_areas,
        chat_enabled,
        verified,
        created_at,
        updated_at
      ) VALUES (
        test_mentor_id,
        'mentor@menvo.com',
        'Mentor',
        'Teste',
        'Mentor de teste para desenvolvimento local',
        ARRAY['JavaScript', 'React', 'Node.js'],
        true,
        true,
        NOW(),
        NOW()
      );
    END IF;
    
    -- Adicionar role de mentor
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (test_mentor_id, mentor_role_id)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Mentor de teste criado: mentor@menvo.com / senha123';
  END IF;
  
  -- Habilitar chat para todos os mentores existentes
  IF mentor_role_id IS NOT NULL THEN
    UPDATE public.profiles 
    SET chat_enabled = true
    WHERE id IN (
      SELECT user_id FROM public.user_roles WHERE role_id = mentor_role_id
    )
    AND (chat_enabled = false OR chat_enabled IS NULL);
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Chat habilitado para % mentores', updated_count;
  END IF;
  
  RAISE NOTICE 'Seed concluído!';
END $$;
