-- Script de emergência para corrigir o banco completamente
-- Execute este script primeiro para resolver todos os problemas

-- 1. REMOVER TUDO QUE PODE ESTAR CAUSANDO CONFLITO
DROP FUNCTION IF EXISTS custom_access_token_hook(json) CASCADE;
DROP FUNCTION IF EXISTS custom_access_token_hook(jsonb) CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. REMOVER ENUMS PROBLEMÁTICOS SE EXISTIREM
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        DROP TYPE user_role CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        DROP TYPE user_status CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        DROP TYPE verification_status CASCADE;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao remover tipos: %', SQLERRM;
END $$;

-- 3. RECRIAR ENUMS LIMPOS
CREATE TYPE user_role AS ENUM (
    'pending', 
    'mentee', 
    'mentor', 
    'admin', 
    'volunteer', 
    'moderator'
);

CREATE TYPE user_status AS ENUM (
    'pending', 
    'active', 
    'suspended', 
    'rejected'
);

CREATE TYPE verification_status AS ENUM (
    'pending', 
    'verified', 
    'rejected'
);

-- 4. LIMPAR E RECRIAR TABELA PROFILES
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    role user_role DEFAULT 'pending'::user_role NOT NULL,
    status user_status DEFAULT 'pending'::user_status NOT NULL,
    verification_status verification_status DEFAULT 'pending'::verification_status NOT NULL,
    slug TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. CRIAR TABELAS DE PERMISSÕES E ROLES
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

CREATE TABLE permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- 6. INSERIR DADOS BÁSICOS
INSERT INTO permissions (name, description) VALUES
    ('view_mentors', 'Visualizar mentores'),
    ('book_sessions', 'Agendar sessões'),
    ('provide_mentorship', 'Fornecer mentoria'),
    ('manage_availability', 'Gerenciar disponibilidade'),
    ('admin_users', 'Administrar usuários'),
    ('admin_verifications', 'Administrar verificações'),
    ('admin_system', 'Administrar sistema'),
    ('validate_activities', 'Validar atividades'),
    ('moderate_content', 'Moderar conteúdo');

INSERT INTO roles (name, description) VALUES
    ('pending', 'Usuário pendente'),
    ('mentee', 'Mentorado'),
    ('mentor', 'Mentor'),
    ('admin', 'Administrador'),
    ('volunteer', 'Voluntário'),
    ('moderator', 'Moderador');

-- 7. CONFIGURAR PERMISSÕES POR ROLE
DO $$
DECLARE
    role_id UUID;
BEGIN
    -- MENTEE permissions
    SELECT id INTO role_id FROM roles WHERE name = 'mentee';
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT role_id, id FROM permissions WHERE name IN ('view_mentors', 'book_sessions');
    
    -- MENTOR permissions
    SELECT id INTO role_id FROM roles WHERE name = 'mentor';
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT role_id, id FROM permissions WHERE name IN ('view_mentors', 'book_sessions', 'provide_mentorship', 'manage_availability');
    
    -- ADMIN permissions (todas)
    SELECT id INTO role_id FROM roles WHERE name = 'admin';
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT role_id, id FROM permissions;
    
    -- VOLUNTEER permissions
    SELECT id INTO role_id FROM roles WHERE name = 'volunteer';
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT role_id, id FROM permissions WHERE name IN ('view_mentors', 'validate_activities');
    
    -- MODERATOR permissions
    SELECT id INTO role_id FROM roles WHERE name = 'moderator';
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT role_id, id FROM permissions WHERE name IN ('view_mentors', 'moderate_content', 'admin_verifications');
END $$;

-- 8. FUNÇÃO PARA ATUALIZAR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. FUNÇÃO PARA GERAR SLUG
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

-- 10. FUNÇÃO PARA LIDAR COM NOVOS USUÁRIOS
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
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. FUNÇÃO CUSTOM ACCESS TOKEN HOOK
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
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Erro no custom_access_token_hook para usuário %: %', (event->>'user_id'), SQLERRM;
        -- Retornar claims padrão em caso de erro
        RETURN jsonb_set(event, '{claims}', jsonb_build_object(
            'user_role', 'pending',
            'user_status', 'pending',
            'permissions', ARRAY[]::TEXT[]
        ));
END;
$$;

-- 12. CRIAR TRIGGERS
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER generate_profile_slug_trigger
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION generate_profile_slug();

-- 13. CONFIGURAR RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

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

-- 14. CONCEDER PERMISSÕES
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.roles TO anon, authenticated;
GRANT ALL ON public.permissions TO anon, authenticated;
GRANT ALL ON public.role_permissions TO anon, authenticated;
GRANT EXECUTE ON FUNCTION custom_access_token_hook(jsonb) TO supabase_auth_admin;

-- 15. MIGRAR DADOS EXISTENTES SE HOUVER
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Migrar usuários existentes do auth.users que não têm perfil
    FOR user_record IN 
        SELECT u.id, u.email, u.raw_user_meta_data
        FROM auth.users u
        LEFT JOIN public.profiles p ON p.id = u.id
        WHERE p.id IS NULL
    LOOP
        INSERT INTO public.profiles (
            id,
            email,
            first_name,
            last_name,
            full_name,
            role,
            status,
            verification_status
        ) VALUES (
            user_record.id,
            user_record.email,
            COALESCE(user_record.raw_user_meta_data->>'first_name', 'Unknown'),
            COALESCE(user_record.raw_user_meta_data->>'last_name', 'User'),
            COALESCE(user_record.raw_user_meta_data->>'full_name', 
                     COALESCE(user_record.raw_user_meta_data->>'first_name', 'Unknown') || ' ' || 
                     COALESCE(user_record.raw_user_meta_data->>'last_name', 'User')),
            'pending'::user_role,
            'pending'::user_status,
            'pending'::verification_status
        );
    END LOOP;
    
    RAISE NOTICE 'Migração de usuários existentes concluída';
END $$;
