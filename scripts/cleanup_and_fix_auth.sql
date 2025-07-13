-- Limpar funções desnecessárias
DROP FUNCTION IF EXISTS add_custom_claims(uuid);
DROP FUNCTION IF EXISTS authorize(text, text, uuid);
DROP FUNCTION IF EXISTS drop_all_enums();
DROP FUNCTION IF EXISTS generate_unique_slug(text, text);
DROP FUNCTION IF EXISTS get_user_permissions(uuid);
DROP FUNCTION IF EXISTS user_has_permission(uuid, text);

-- Criar função para lidar com novos usuários
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'pending'::user_role,
    'pending'::user_status,
    'pending',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Função para gerar slug do perfil
CREATE OR REPLACE FUNCTION generate_profile_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Gerar slug base a partir do nome
  IF NEW.first_name IS NOT NULL AND NEW.first_name != '' THEN
    base_slug := lower(regexp_replace(NEW.first_name || '-' || COALESCE(NEW.last_name, ''), '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(base_slug, '-');
  ELSE
    base_slug := 'user-' || substring(NEW.id::text from 1 for 8);
  END IF;

  final_slug := base_slug;

  -- Verificar se o slug já existe e adicionar número se necessário
  WHILE EXISTS (SELECT 1 FROM profiles WHERE slug = final_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar slug
DROP TRIGGER IF EXISTS generate_profile_slug_trigger ON profiles;
CREATE TRIGGER generate_profile_slug_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION generate_profile_slug();

-- Função para JWT claims customizados
CREATE OR REPLACE FUNCTION custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_role text;
  user_status text;
BEGIN
  -- Buscar role e status do usuário
  SELECT role, status INTO user_role, user_status
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;

  claims := event->'claims';

  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  END IF;

  IF user_status IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_status}', to_jsonb(user_status));
  END IF;

  -- Retornar evento com claims atualizados
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Garantir que a função update_updated_at_column existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de updated_at na tabela profiles se não existir
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migrar usuários existentes sem perfil
INSERT INTO public.profiles (id, email, role, status, verification_status, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  'pending'::user_role,
  'pending'::user_status,
  'pending',
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

COMMIT;
