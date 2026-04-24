
-- 1. Atualizar a função handle_new_user para atribuir o papel 'mentee' automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_slug TEXT;
  meta_first_name TEXT;
  meta_last_name TEXT;
  mentee_role_id UUID;
BEGIN
  -- Extrair nomes dos metadados
  meta_first_name := NEW.raw_user_meta_data->>'first_name';
  meta_last_name := NEW.raw_user_meta_data->>'last_name';
  
  IF meta_first_name IS NULL AND NEW.raw_user_meta_data->>'full_name' IS NOT NULL THEN
    meta_first_name := split_part(NEW.raw_user_meta_data->>'full_name', ' ', 1);
    meta_last_name := substring(NEW.raw_user_meta_data->>'full_name' from position(' ' in NEW.raw_user_meta_data->>'full_name') + 1);
  END IF;

  -- Gerar slug único
  user_slug := public.generate_unique_slug(split_part(NEW.email, '@', 1));
  
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
    NEW.id,
    NEW.email,
    meta_first_name,
    meta_last_name,
    user_slug,
    false,
    NOW(),
    NOW()
  );

  -- Atribuir papel 'mentee' automaticamente
  SELECT id INTO mentee_role_id FROM public.roles WHERE name = 'mentee' LIMIT 1;
  
  IF mentee_role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (NEW.id, mentee_role_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;
