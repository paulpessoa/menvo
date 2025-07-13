-- =================================================================
-- MENVO - SCRIPT DE SCHEMA INICIAL
-- Este script cria toda a estrutura do banco de dados do zero.
-- =================================================================

BEGIN;

-- 1. REMOVER ESTRUTURAS ANTIGAS PARA GARANTIR UM COMEÇO LIMPO
DROP FUNCTION IF EXISTS custom_access_token_hook(jsonb) CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.user_status CASCADE;
DROP TYPE IF EXISTS public.verification_status CASCADE;

-- 2. CRIAR TIPOS (ENUMS)
CREATE TYPE public.user_role AS ENUM ('pending', 'mentee', 'mentor', 'admin', 'volunteer', 'moderator');
CREATE TYPE public.user_status AS ENUM ('pending', 'active', 'suspended', 'rejected');
CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected');

-- 3. CRIAR TABELAS PRINCIPAIS (RBAC)
CREATE TABLE public.permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.permissions IS 'Armazena as permissões de ação no sistema.';

CREATE TABLE public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name user_role UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.roles IS 'Armazena as roles (funções) dos usuários.';

CREATE TABLE public.role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE NOT NULL,
    UNIQUE (role_id, permission_id)
);
COMMENT ON TABLE public.role_permissions IS 'Tabela de junção para mapear permissões para roles.';

-- 4. CRIAR TABELA DE PERFIS (PROFILES)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    role user_role DEFAULT 'pending' NOT NULL,
    status user_status DEFAULT 'pending' NOT NULL,
    verification_status verification_status DEFAULT 'pending' NOT NULL,
    linkedin_url TEXT,
    presentation_video_url TEXT,
    expertise_areas TEXT,
    verified_at TIMESTAMPTZ,
    verification_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.profiles IS 'Armazena dados públicos e de perfil dos usuários.';

-- 5. INSERIR DADOS ESSENCIAIS (PERMISSÕES E ROLES)
INSERT INTO public.permissions (name, description) VALUES
    ('view_mentors', 'Visualizar mentores'),
    ('book_sessions', 'Agendar sessões'),
    ('provide_mentorship', 'Fornecer mentoria'),
    ('manage_availability', 'Gerenciar disponibilidade'),
    ('admin_users', 'Administrar usuários'),
    ('admin_verifications', 'Administrar verificações'),
    ('admin_system', 'Administrar sistema'),
    ('validate_activities', 'Validar atividades de voluntariado'),
    ('moderate_content', 'Moderar conteúdo da plataforma');

INSERT INTO public.roles (name, description) VALUES
    ('pending', 'Usuário com registro incompleto'),
    ('mentee', 'Mentorado em busca de orientação'),
    ('mentor', 'Mentor que oferece orientação'),
    ('admin', 'Administrador com acesso total'),
    ('volunteer', 'Voluntário que ajuda na plataforma'),
    ('moderator', 'Moderador de conteúdo e verificações');

-- 6. MAPEAR PERMISSÕES PARA ROLES
DO $$
DECLARE
    admin_role_id UUID := (SELECT id FROM public.roles WHERE name = 'admin');
    mentor_role_id UUID := (SELECT id FROM public.roles WHERE name = 'mentor');
    mentee_role_id UUID := (SELECT id FROM public.roles WHERE name = 'mentee');
    moderator_role_id UUID := (SELECT id FROM public.roles WHERE name = 'moderator');
    volunteer_role_id UUID := (SELECT id FROM public.roles WHERE name = 'volunteer');
BEGIN
    -- Permissões de Admin (todas)
    INSERT INTO public.role_permissions (role_id, permission_id) SELECT admin_role_id, id FROM public.permissions;
    -- Permissões de Mentor
    INSERT INTO public.role_permissions (role_id, permission_id) SELECT mentor_role_id, id FROM public.permissions WHERE name IN ('view_mentors', 'provide_mentorship', 'manage_availability');
    -- Permissões de Mentee
    INSERT INTO public.role_permissions (role_id, permission_id) SELECT mentee_role_id, id FROM public.permissions WHERE name IN ('view_mentors', 'book_sessions');
    -- Permissões de Moderador
    INSERT INTO public.role_permissions (role_id, permission_id) SELECT moderator_role_id, id FROM public.permissions WHERE name IN ('admin_verifications', 'moderate_content');
    -- Permissões de Voluntário
    INSERT INTO public.role_permissions (role_id, permission_id) SELECT volunteer_role_id, id FROM public.permissions WHERE name IN ('validate_activities');
END $$;

-- 7. FUNÇÕES E TRIGGERS DO BANCO
-- Função para atualizar o campo `updated_at`
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para `updated_at` na tabela de perfis
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar um perfil quando um novo usuário se registra no `auth.users`
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role_val public.user_role;
BEGIN
    -- Define a role baseada no `user_type` passado durante o signup
    CASE NEW.raw_user_meta_data->>'user_type'
        WHEN 'mentor' THEN user_role_val := 'mentor';
        WHEN 'mentee' THEN user_role_val := 'mentee';
        ELSE user_role_val := 'pending';
    END CASE;

    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        user_role_val
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. HOOK DE CUSTOM ACCESS TOKEN (O CORAÇÃO DO RBAC)
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    claims jsonb;
    profile_role public.user_role;
    profile_status public.user_status;
    profile_permissions TEXT[];
BEGIN
    -- Busca a role e o status do perfil do usuário
    SELECT
        p.role,
        p.status
    INTO
        profile_role,
        profile_status
    FROM public.profiles p
    WHERE p.id = (event->>'user_id')::uuid;

    -- Busca todas as permissões associadas à role do usuário
    SELECT ARRAY_AGG(perm.name)
    INTO profile_permissions
    FROM public.roles r
    JOIN public.role_permissions rp ON r.id = rp.role_id
    JOIN public.permissions perm ON rp.permission_id = perm.id
    WHERE r.name = profile_role;

    -- Monta os claims que serão injetados no JWT
    claims := jsonb_build_object(
        'role', COALESCE(profile_role, 'pending'),
        'status', COALESCE(profile_status, 'pending'),
        'permissions', COALESCE(profile_permissions, '{}'::TEXT[])
    );

    -- Mescla os novos claims com os claims existentes no evento
    RETURN jsonb_set(event, '{claims}', (event->'claims') || claims);
END;
$$;

-- Concede permissão para o hook ser executado pelo Supabase Auth
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;

-- 9. CONFIGURAÇÃO DE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins have full access" ON public.profiles
    FOR ALL USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

COMMIT;
