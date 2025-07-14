-- Esta função será usada no hook JWT do Supabase
-- Copie esta função e cole no SQL Editor do Supabase
-- Depois configure o hook JWT para usar esta função

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_role text;
BEGIN
  -- Buscar role do usuário
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;

  -- Definir claims
  claims := event->'claims';
  
  -- Adicionar role aos claims
  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  ELSE
    claims := jsonb_set(claims, '{user_role}', '"pending"');
  END IF;

  -- Retornar evento com claims atualizados
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Conceder permissões necessárias
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO service_role;

-- Instruções para configurar o hook:
-- 1. Vá para Authentication > Hooks no dashboard do Supabase
-- 2. Clique em "Add Customize Access Token (JWT) Claims hook"
-- 3. Selecione "Postgres" como Hook type
-- 4. Selecione "public" como schema
-- 5. Selecione "custom_access_token_hook" como function
-- 6. Clique em "Create hook"
-- URL: https://your-project.supabase.co/rest/v1/rpc/custom_access_token_hook
-- HTTP Headers: {"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}
