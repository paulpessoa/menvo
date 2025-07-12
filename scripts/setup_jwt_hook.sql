-- Esta função será usada no hook JWT do Supabase
-- Copie esta função e cole no SQL Editor do Supabase
-- Depois configure o hook JWT para usar esta função

CREATE OR REPLACE FUNCTION custom_access_token_hook(event json)
RETURNS json AS $$
DECLARE
    claims json;
    user_id uuid;
    user_role text;
    user_status text;
    user_email text;
BEGIN
    -- Extrair user_id do evento
    user_id := (event->>'user_id')::uuid;
    
    -- Buscar dados do usuário na tabela profiles
    SELECT role, status, email
    INTO user_role, user_status, user_email
    FROM public.profiles
    WHERE id = user_id;
    
    -- Criar claims customizados
    claims := jsonb_build_object(
        'role', COALESCE(user_role, 'pending'),
        'status', COALESCE(user_status, 'pending'),
        'email', COALESCE(user_email, ''),
        'user_id', user_id
    );
    
    -- Retornar evento com claims adicionados
    RETURN jsonb_set(
        event::jsonb,
        '{claims}',
        claims
    );
END;
$$ language 'plpgsql' security definer;

-- Conceder permissões para o hook
GRANT EXECUTE ON FUNCTION custom_access_token_hook(json) TO supabase_auth_admin;

-- Instruções para configurar o hook:
-- 1. Vá para Authentication > Hooks no dashboard do Supabase
-- 2. Clique em "Add Customize Access Token (JWT) Claims hook"
-- 3. Selecione "Postgres" como Hook type
-- 4. Selecione "public" como schema
-- 5. Selecione "custom_access_token_hook" como function
-- 6. Clique em "Create hook"
