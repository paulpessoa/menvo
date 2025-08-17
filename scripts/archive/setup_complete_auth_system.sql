-- Criar tipos ENUM necessários
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('pending', 'mentee', 'mentor', 'admin', 'moderator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('pending', 'pending_role_selection', 'incomplete', 'validation_pending', 'active', 'suspended', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar tabela profiles se não existir
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email text UNIQUE NOT NULL,
    first_name text,
    last_name text,
    full_name text,
    slug text UNIQUE,
    avatar_url text,
    bio text,
    role user_role DEFAULT 'pending'::user_role,
    status user_status DEFAULT 'pending'::user_status,
    verification_status text DEFAULT 'pending',
    location text,
    skills text[],
    experience_level text,
    linkedin_url text,
    github_url text,
    website_url text,
    phone text,
    timezone text,
    is_available boolean DEFAULT true,
    email_confirmed_at timestamptz,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
);

-- Criar tabela validation_requests se não existir
CREATE TABLE IF NOT EXISTS public.validation_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    requested_role user_role NOT NULL,
    status text DEFAULT 'pending',
    admin_notes text,
    reviewed_by uuid REFERENCES public.profiles(id),
    reviewed_at timestamptz,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
);

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar função para gerar slug do perfil
CREATE OR REPLACE FUNCTION generate_profile_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug text;
    final_slug text;
    counter integer := 0;
BEGIN
    -- Gerar slug base a partir do nome
    IF NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN
        base_slug := lower(trim(NEW.first_name || '-' || NEW.last_name));
    ELSIF NEW.full_name IS NOT NULL THEN
        base_slug := lower(trim(NEW.full_name));
    ELSE
        base_slug := 'user-' || substring(NEW.id::text from 1 for 8);
    END IF;
    
    -- Remover caracteres especiais e espaços
    base_slug := regexp_replace(base_slug, '[^a-z0-9\-]', '', 'g');
    base_slug := regexp_replace(base_slug, '\-+', '-', 'g');
    base_slug := trim(base_slug, '-');
    
    final_slug := base_slug;
    
    -- Verificar se slug já existe e adicionar número se necessário
    WHILE EXISTS (SELECT 1 FROM profiles WHERE slug = final_slug AND id != NEW.id) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := final_slug;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar função para lidar com novos usuários
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role text := 'pending';
    first_name_val text;
    last_name_val text;
    full_name_val text;
BEGIN
    -- Extrair dados dos metadados
    first_name_val := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
    last_name_val := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
    full_name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', first_name_val || ' ' || last_name_val);
    
    -- Determinar role baseado nos metadados
    IF NEW.raw_user_meta_data->>'user_type' IS NOT NULL THEN
        user_role := NEW.raw_user_meta_data->>'user_type';
    END IF;

    -- Inserir perfil na tabela profiles
    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        full_name,
        role,
        status,
        verification_status,
        email_confirmed_at,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        NULLIF(trim(first_name_val), ''),
        NULLIF(trim(last_name_val), ''),
        NULLIF(trim(full_name_val), ''),
        user_role::user_role,
        'pending'::user_status,
        'pending',
        NEW.email_confirmed_at,
        NOW(),
        NOW()
    );

    RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Criar função para adicionar claims customizados ao JWT
CREATE OR REPLACE FUNCTION add_custom_claims(user_id uuid)
RETURNS json AS $$
DECLARE
    claims json;
    user_role text;
    user_status text;
    user_email text;
BEGIN
    -- Buscar dados do usuário na tabela profiles
    SELECT role, status, email
    INTO user_role, user_status, user_email
    FROM public.profiles
    WHERE id = user_id;

    -- Criar claims customizados
    claims := json_build_object(
        'role', COALESCE(user_role, 'pending'),
        'status', COALESCE(user_status, 'pending'),
        'email', user_email,
        'user_id', user_id
    );

    RETURN claims;
END;
$$ language 'plpgsql' security definer;

-- Remover triggers existentes se existirem
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS generate_profile_slug_trigger ON public.profiles;

-- Criar trigger para novos usuários
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar trigger para gerar slug
CREATE TRIGGER generate_profile_slug_trigger
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION generate_profile_slug();

-- Habilitar RLS nas tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'moderator')
        )
    );

-- Criar função para o hook JWT (esta será usada no hook do Supabase)
CREATE OR REPLACE FUNCTION custom_access_token_hook(event json)
RETURNS json AS $$
DECLARE
    claims json;
    user_id uuid;
    user_role text;
    user_status text;
BEGIN
    -- Extrair user_id do evento
    user_id := (event->>'user_id')::uuid;
    
    -- Buscar dados do usuário
    SELECT role, status
    INTO user_role, user_status
    FROM public.profiles
    WHERE id = user_id;
    
    -- Adicionar claims customizados
    claims := jsonb_build_object(
        'role', COALESCE(user_role, 'pending'),
        'status', COALESCE(user_status, 'pending'),
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

-- Adicionando índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON public.profiles(slug);
CREATE INDEX IF NOT EXISTS idx_validation_requests_user_id ON public.validation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_validation_requests_status ON public.validation_requests(status);

-- Conceder permissões necessárias
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT EXECUTE ON FUNCTION custom_access_token_hook(json) TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION add_custom_claims(uuid) TO authenticated;
