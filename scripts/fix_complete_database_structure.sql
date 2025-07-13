-- Script completo para corrigir toda a estrutura do banco
BEGIN;

-- 1. CRIAR ENUMS NECESSÁRIOS
DO $$ 
BEGIN
    -- Criar enum user_role se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('pending', 'mentee', 'mentor', 'admin', 'volunteer', 'moderator');
    END IF;
    
    -- Criar enum user_status se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended', 'rejected');
    END IF;
    
    -- Criar enum verification_status se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
    END IF;
END $$;

-- 2. CRIAR TABELA DE PERMISSÕES
CREATE TABLE IF NOT EXISTS permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRIAR TABELA DE ROLES
CREATE TABLE IF NOT EXISTS roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CRIAR TABELA DE ROLE_PERMISSIONS
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- 5. CORRIGIR TABELA PROFILES
DO $$
BEGIN
    -- Remover colunas problemáticas se existirem
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role' AND data_type != 'USER-DEFINED') THEN
        ALTER TABLE profiles DROP COLUMN role CASCADE;
    END IF;
    
    -- Adicionar colunas necessárias
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'pending'::user_role;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN
        ALTER TABLE profiles ADD COLUMN status user_status DEFAULT 'pending'::user_status;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verification_status') THEN
        ALTER TABLE profiles ADD COLUMN verification_status verification_status DEFAULT 'pending'::verification_status;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'slug') THEN
        ALTER TABLE profiles ADD COLUMN slug TEXT UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
        ALTER TABLE profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 6. INSERIR PERMISSÕES BÁSICAS
INSERT INTO permissions (name, description) VALUES
    ('view_mentors', 'Visualizar mentores'),
    ('book_sessions', 'Agendar sessões'),
    ('provide_mentorship', 'Fornecer mentoria'),
    ('manage_availability', 'Gerenciar disponibilidade'),
    ('admin_users', 'Administrar usuários'),
    ('admin_verifications', 'Administrar verificações'),
    ('admin_system', 'Administrar sistema'),
    ('validate_activities', 'Validar atividades'),
    ('moderate_content', 'Moderar conteúdo')
ON CONFLICT (name) DO NOTHING;

-- 7. INSERIR ROLES BÁSICAS
INSERT INTO roles (name, description) VALUES
    ('pending', 'Usuário pendente'),
    ('mentee', 'Mentorado'),
    ('mentor', 'Mentor'),
    ('admin', 'Administrador'),
    ('volunteer', 'Voluntário'),
    ('moderator', 'Moderador')
ON CONFLICT (name) DO NOTHING;

-- 8. CONFIGURAR PERMISSÕES POR ROLE
DO $$
DECLARE
    role_id UUID;
    perm_id UUID;
BEGIN
    -- MENTEE permissions
    SELECT id INTO role_id FROM roles WHERE name = 'mentee';
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT role_id, id FROM permissions WHERE name IN ('view_mentors', 'book_sessions')
    ON CONFLICT DO NOTHING;
    
    -- MENTOR permissions
    SELECT id INTO role_id FROM roles WHERE name = 'mentor';
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT role_id, id FROM permissions WHERE name IN ('view_mentors', 'book_sessions', 'provide_mentorship', 'manage_availability')
    ON CONFLICT DO NOTHING;
    
    -- ADMIN permissions (todas)
    SELECT id INTO role_id FROM roles WHERE name = 'admin';
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT role_id, id FROM permissions
    ON CONFLICT DO NOTHING;
    
    -- VOLUNTEER permissions
    SELECT id INTO role_id FROM roles WHERE name = 'volunteer';
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT role_id, id FROM permissions WHERE name IN ('view_mentors', 'validate_activities')
    ON CONFLICT DO NOTHING;
    
    -- MODERATOR permissions
    SELECT id INTO role_id FROM roles WHERE name = 'moderator';
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT role_id, id FROM permissions WHERE name IN ('view_mentors', 'moderate_content', 'admin_verifications')
    ON CONFLICT DO NOTHING;
END $$;

-- 9. FUNÇÃO PARA ATUALIZAR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. FUNÇÃO PARA GERAR SLUG
CREATE OR REPLACE FUNCTION generate_profile_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Gerar slug base
    IF NEW.full_name IS NOT NULL AND NEW.full_name != '' THEN
        base_slug := LOWER(REGEXP_REPLACE(NEW.full_name, '[^a-zA-Z0-9]+', '-', 'g'));
    ELSIF NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN
        base_slug := LOWER(REGEXP_REPLACE(NEW.first_name || '-' || NEW.last_name, '[^a-zA-Z0-9]+', '-', 'g'));
    ELSE
        base_slug := 'user-' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 8);
    END IF;
    
    base_slug := TRIM(base_slug, '-');
    final_slug := base_slug;
    
    -- Verificar unicidade
    WHILE EXISTS (SELECT 1 FROM profiles WHERE slug = final_slug AND id != NEW.id) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := final_slug;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. FUNÇÃO PARA LIDAR COM NOVOS USUÁRIOS
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    first_name_val TEXT;
    last_name_val TEXT;
    full_name_val TEXT;
    user_role_val user_role;
BEGIN
    -- Extrair dados dos metadados
    first_name_val := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), ''), 'Unknown');
    last_name_val := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'), ''), 'User');
    full_name_val := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), first_name_val || ' ' || last_name_val);
    
    -- Determinar role
    CASE COALESCE(NULLIF(NEW.raw_user_meta_data->>'user_type', ''), 'pending')
        WHEN 'mentor' THEN user_role_val := 'mentor'::user_role;
        WHEN 'mentee' THEN user_role_val := 'mentee'::user_role;
        WHEN 'volunteer' THEN user_role_val := 'volunteer'::user_role;
        WHEN 'admin' THEN user_role_val := 'admin'::user_role;
        ELSE user_role_val := 'pending'::user_role;
    END CASE;

    -- Inserir perfil
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
    ) VALUES (
        NEW.id,
        NEW.email,
        first_name_val,
        last_name_val,
        full_name_val,
        user_role_val,
        'pending'::user_status,
        'pending'::verification_status,
        NOW(),
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. FUNÇÃO CUSTOM ACCESS TOKEN HOOK (CORRIGIDA)
CREATE OR REPLACE FUNCTION custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    claims jsonb;
    user_role_val TEXT;
    user_status_val TEXT;
    user_permissions TEXT[];
BEGIN
    -- Buscar dados do usuário
    SELECT 
        p.role::TEXT,
        p.status::TEXT
    INTO 
        user_role_val,
        user_status_val
    FROM public.profiles p
    WHERE p.id = (event->>'user_id')::uuid;

    -- Buscar permissões do usuário
    SELECT ARRAY_AGG(perm.name)
    INTO user_permissions
    FROM public.profiles p
    JOIN public.roles r ON r.name = p.role::TEXT
    JOIN public.role_permissions rp ON rp.role_id = r.id
    JOIN public.permissions perm ON perm.id = rp.permission_id
    WHERE p.id = (event->>'user_id')::uuid;

    -- Criar claims customizados
    claims := jsonb_build_object(
        'user_role', COALESCE(user_role_val, 'pending'),
        'user_status', COALESCE(user_status_val, 'pending'),
        'permissions', COALESCE(user_permissions, ARRAY[]::TEXT[]),
        'app_metadata', jsonb_build_object(
            'role', COALESCE(user_role_val, 'pending'),
            'status', COALESCE(user_status_val, 'pending'),
            'permissions', COALESCE(user_permissions, ARRAY[]::TEXT[])
        )
    );

    -- Retornar evento com claims
    RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- 13. REMOVER TRIGGERS EXISTENTES E RECRIAR
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS generate_profile_slug_trigger ON public.profiles;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER generate_profile_slug_trigger
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION generate_profile_slug();

-- 14. CONFIGURAR RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

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
            AND role = 'admin'::user_role
        )
    );

-- 15. CONCEDER PERMISSÕES
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.roles TO anon, authenticated;
GRANT ALL ON public.permissions TO anon, authenticated;
GRANT ALL ON public.role_permissions TO anon, authenticated;
GRANT EXECUTE ON FUNCTION custom_access_token_hook(jsonb) TO supabase_auth_admin;

COMMIT;
