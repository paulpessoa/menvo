-- Limpar funções desnecessárias
DROP FUNCTION IF EXISTS add_custom_claims(uuid);
DROP FUNCTION IF EXISTS authorize(text, text, text);
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
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), ' ', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), ' ', 2)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
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

-- Função para gerar slug único
CREATE OR REPLACE FUNCTION generate_profile_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Gerar slug base a partir do nome
  base_slug := lower(regexp_replace(
    COALESCE(NEW.full_name, NEW.first_name || ' ' || NEW.last_name, NEW.email),
    '[^a-zA-Z0-9\s]', '', 'g'
  ));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  
  -- Garantir que o slug seja único
  final_slug := base_slug;
  
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

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para JWT claims customizados
CREATE OR REPLACE FUNCTION custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_role text;
BEGIN
  -- Buscar a role do usuário na tabela profiles
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;

  -- Definir claims customizados
  claims := jsonb_build_object(
    'user_role', COALESCE(user_role, 'pending'),
    'app_metadata', jsonb_build_object(
      'role', COALESCE(user_role, 'pending')
    )
  );

  -- Retornar o evento com os claims adicionados
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Garantir que a tabela profiles existe com a estrutura correta
DO $$
BEGIN
  -- Verificar se a coluna role existe, se não, criar
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'pending'::user_role;
  END IF;

  -- Verificar se a coluna status existe, se não, criar
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN status user_status DEFAULT 'pending'::user_status;
  END IF;
END $$;

-- Criar perfis para usuários existentes que não têm perfil
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
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'first_name', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'last_name', ''),
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  'pending'::user_role,
  'pending'::user_status,
  'pending',
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;
