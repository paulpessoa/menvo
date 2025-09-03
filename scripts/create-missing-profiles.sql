-- Script para criar perfis para usuários que não têm
-- EXECUTE APENAS APÓS VERIFICAR COM O SCRIPT check-missing-profiles.sql

-- Função para criar perfis faltantes
DO $$
DECLARE
  user_record RECORD;
  user_slug TEXT;
  first_name_val TEXT;
  last_name_val TEXT;
  full_name_val TEXT;
BEGIN
  -- Iterar sobre usuários sem perfil
  FOR user_record IN 
    SELECT 
      au.id,
      au.email,
      au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
  LOOP
    -- Extrair metadados
    first_name_val := COALESCE(user_record.raw_user_meta_data->>'first_name', '');
    last_name_val := COALESCE(user_record.raw_user_meta_data->>'last_name', '');
    full_name_val := COALESCE(user_record.raw_user_meta_data->>'full_name', '');
    
    -- Se full_name está vazio mas temos first/last, construir
    IF full_name_val = '' AND (first_name_val != '' OR last_name_val != '') THEN
      full_name_val := trim(first_name_val || ' ' || last_name_val);
    END IF;
    
    -- Gerar slug
    IF full_name_val != '' THEN
      user_slug := public.generate_unique_slug(full_name_val);
    ELSE
      user_slug := public.generate_unique_slug(split_part(user_record.email, '@', 1));
    END IF;
    
    -- Criar perfil
    INSERT INTO public.profiles (
      id,
      email,
      first_name,
      last_name,
      slug,
      verified,
      created_at,
      updated_at
    ) VALUES (
      user_record.id,
      user_record.email,
      NULLIF(first_name_val, ''),
      NULLIF(last_name_val, ''),
      user_slug,
      false,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Criado perfil para usuário: % (%)', user_record.email, user_record.id;
  END LOOP;
END $$;