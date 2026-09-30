-- Fix linting warnings and errors

-- Add unique constraint to user_roles so ON CONFLICT works properly
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_id_role_id_idx ON public.user_roles (user_id, role_id);
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_id_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_id_key UNIQUE USING INDEX user_roles_user_id_role_id_idx;

-- 1. public.assign_user_role
-- Error: column reference "user_id" is ambiguous
-- Solution: rename parameter to p_user_id, role_name to p_role_name, role_id to v_role_id
DROP FUNCTION IF EXISTS public.assign_user_role(uuid, text);

CREATE OR REPLACE FUNCTION public.assign_user_role(p_user_id uuid, p_role_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_role_id INTEGER;
BEGIN
  -- Get role ID
  SELECT id INTO v_role_id FROM public.roles WHERE name = p_role_name;
  
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Role % does not exist', p_role_name;
  END IF;
  
  -- Insert or update user role
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (p_user_id, v_role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;
  
  RETURN TRUE;
END;
$function$;

-- 2. public.get_user_role
-- Error: column reference "user_id" is ambiguous
-- Solution: rename parameter to p_user_id
DROP FUNCTION IF EXISTS public.get_user_role(uuid);

CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  role_name TEXT;
BEGIN
  SELECT r.name
  INTO role_name
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id
  LIMIT 1;
  
  RETURN role_name;
END;
$function$;

-- 3. public.generate_secure_token
-- Warning: unused variable "i" / auto variable "i" shadows a previously defined variable
-- Solution: remove explicitly declared "i INTEGER;" since FOR loop declares it implicitly
CREATE OR REPLACE FUNCTION public.generate_secure_token(length integer DEFAULT 64)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$function$;

-- 4. public.save_google_calendar_tokens
-- Warning: unused parameter "p_scope"
-- Solution: add a dummy evaluation of p_scope to suppress the warning without breaking RPC signature
CREATE OR REPLACE FUNCTION public.save_google_calendar_tokens(p_user_id uuid, p_access_token text, p_refresh_token text, p_expires_in integer, p_scope text DEFAULT 'https://www.googleapis.com/auth/calendar'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_expiry_date BIGINT;
BEGIN
    -- Dummy use to suppress 'unused parameter' warning
    IF p_scope IS NULL THEN
        -- Do nothing
    END IF;

    -- Calcular expiry_date como timestamp em milissegundos
    v_expiry_date := (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT + (p_expires_in * 1000)::BIGINT;

    INSERT INTO public.google_calendar_tokens (user_id, access_token, refresh_token, expiry_date, updated_at)
    VALUES (p_user_id, p_access_token, p_refresh_token, v_expiry_date, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expiry_date = EXCLUDED.expiry_date,
        updated_at = NOW();
END;
$function$;
