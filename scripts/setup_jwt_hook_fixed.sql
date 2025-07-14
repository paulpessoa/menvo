-- Função JWT Hook corrigida
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  user_role text;
  user_status text;
BEGIN
  -- Extrair claims existentes
  claims := COALESCE(event->'claims', '{}'::jsonb);
  
  -- Buscar dados do usuário
  SELECT role, status INTO user_role, user_status
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;
  
  -- Adicionar claims customizados
  claims := jsonb_set(claims, '{user_role}', to_jsonb(COALESCE(user_role, 'pending')));
  claims := jsonb_set(claims, '{user_status}', to_jsonb(COALESCE(user_status, 'pending')));
  
  -- Retornar evento com claims atualizados
  RETURN jsonb_set(event, '{claims}', claims);
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, retornar evento original com claims padrão
    claims := jsonb_set(COALESCE(event->'claims', '{}'::jsonb), '{user_role}', '"pending"');
    claims := jsonb_set(claims, '{user_status}', '"pending"');
    RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Conceder permissões corretas
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT SELECT ON public.profiles TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;

-- Instruções para configurar no Dashboard:
-- 1. Vá para Authentication > Hooks
-- 2. Clique em "Add Hook"
-- 3. Selecione "Custom Access Token"
-- 4. Method: POST
-- 5. URL: pg-functions://postgres/public/custom_access_token_hook
-- 6. Salve a configuração
