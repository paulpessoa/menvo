-- Remover funções redundantes e triggers antigos
DROP FUNCTION IF EXISTS add_custom_claims(uuid);
DROP FUNCTION IF EXISTS authorize(text, text, uuid);
DROP FUNCTION IF EXISTS drop_all_enums();
DROP FUNCTION IF EXISTS generate_unique_slug(text, text);
DROP FUNCTION IF EXISTS get_user_permissions(uuid);
DROP FUNCTION IF EXISTS user_has_permission(uuid, text);

-- Remover triggers antigos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS generate_profile_slug_trigger ON public.profiles;

-- Função para atualizar updated_at (manter)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Função para gerar slug único
CREATE OR REPLACE FUNCTION generate_profile_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Gerar slug base a partir do nome
  IF NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN
    base_slug := lower(NEW.first_name || '-' || NEW.last_name);
  ELSIF NEW.first_name IS NOT NULL THEN
    base_slug := lower(NEW.first_name);
  ELSE
    base_slug := 'user';
  END IF;
  
  -- Remover caracteres especiais e espaços
  base_slug := regexp_replace(base_slug, '[^a-z0-9\-]', '', 'g');
  base_slug := regexp_replace(base_slug, '\-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
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

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    status,
    email_confirmed_at,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), ' ', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), ' ', 2)),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'pending')::user_role,
    'pending'::user_status,
    NEW.email_confirmed_at,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

  -- Criar claims customizados
  claims := jsonb_build_object(
    'user_role', COALESCE(user_role, 'pending'),
    'user_status', COALESCE(user_status, 'pending'),
    'app_metadata', jsonb_build_object(
      'role', COALESCE(user_role, 'pending'),
      'status', COALESCE(user_status, 'pending')
    )
  );

  -- Adicionar claims ao evento
  event := jsonb_set(event, '{claims}', claims);

  RETURN event;
END;
$$;

-- Recriar triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER generate_profile_slug_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION generate_profile_slug();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Garantir que a tabela profiles existe com a estrutura correta
DO $$
BEGIN
  -- Verificar se a tabela existe
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
    -- Criar tabela se não existir
    CREATE TABLE public.profiles (
      id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      email text NOT NULL,
      first_name text,
      last_name text,
      slug text UNIQUE,
      avatar_url text,
      bio text,
      location text,
      role user_role DEFAULT 'pending'::user_role,
      status user_status DEFAULT 'pending'::user_status,
      is_volunteer boolean DEFAULT false,
      email_confirmed_at timestamp with time zone,
      verified_at timestamp with time zone,
      verified_by uuid REFERENCES profiles(id),
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      verification_status text DEFAULT 'pending',
      PRIMARY KEY (id)
    );

    -- Criar índices
    CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
    CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
    CREATE INDEX IF NOT EXISTS idx_profiles_slug ON profiles(slug);
    CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
  END IF;
END
$$;

-- Migrar usuários existentes que não têm perfil
INSERT INTO public.profiles (id, email, first_name, last_name, role, status, email_confirmed_at, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'first_name', split_part(COALESCE(u.raw_user_meta_data->>'full_name', u.email), ' ', 1)),
  COALESCE(u.raw_user_meta_data->>'last_name', split_part(COALESCE(u.raw_user_meta_data->>'full_name', ''), ' ', 2)),
  COALESCE(u.raw_user_meta_data->>'user_type', 'pending')::user_role,
  'pending'::user_status,
  u.email_confirmed_at,
  u.created_at,
  NOW()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION custom_access_token_hook(jsonb) TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION handle_new_user() TO supabase_auth_admin;
