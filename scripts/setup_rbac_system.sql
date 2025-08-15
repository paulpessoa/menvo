-- =====================================================
-- SISTEMA RBAC COMPLETO PARA MENTOR CONNECT
-- =====================================================

-- Limpar tabelas existentes (cuidado em produção!)
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.validation_requests CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Remover tipos existentes
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.user_status CASCADE;
DROP TYPE IF EXISTS public.verification_status CASCADE;
DROP TYPE IF EXISTS public.validation_status CASCADE;

-- =====================================================
-- 1. CRIAR TIPOS ENUM
-- =====================================================

CREATE TYPE public.user_role AS ENUM ('admin', 'mentor', 'mentee');
CREATE TYPE public.user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
CREATE TYPE public.verification_status AS ENUM ('pending_validation', 'validated', 'rejected', 'active');
CREATE TYPE public.validation_status AS ENUM ('pending', 'approved', 'rejected');

-- =====================================================
-- 2. TABELA DE ROLES
-- =====================================================

CREATE TABLE public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. TABELA DE PERMISSIONS
-- =====================================================

CREATE TABLE public.permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. TABELA DE ROLE_PERMISSIONS
-- =====================================================

CREATE TABLE public.role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- =====================================================
-- 5. TABELA DE PROFILES (PRINCIPAL)
-- =====================================================

CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    avatar_url TEXT,
    bio TEXT,
    role public.user_role DEFAULT 'mentee',
    status public.user_status DEFAULT 'active',
    verification_status public.verification_status DEFAULT 'active',
    
    -- Campos específicos para mentores
    expertise_areas TEXT[],
    experience_level VARCHAR(20),
    linkedin_url TEXT,
    github_url TEXT,
    website_url TEXT,
    
    -- Campos de localização
    location VARCHAR(200),
    timezone VARCHAR(50),
    
    -- Campos de configuração
    is_available BOOLEAN DEFAULT true,
    max_mentees INTEGER DEFAULT 5,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. TABELA DE USER_ROLES (PARA RBAC AVANÇADO)
-- =====================================================

CREATE TABLE public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, role_id)
);

-- =====================================================
-- 7. TABELA DE VALIDATION_REQUESTS
-- =====================================================

CREATE TABLE public.validation_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL,
    status public.validation_status DEFAULT 'pending',
    data JSONB,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES public.profiles(id),
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_status ON public.profiles(status);
CREATE INDEX idx_profiles_verification_status ON public.profiles(verification_status);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON public.user_roles(role_id);
CREATE INDEX idx_validation_requests_user_id ON public.validation_requests(user_id);
CREATE INDEX idx_validation_requests_status ON public.validation_requests(status);

-- =====================================================
-- 9. INSERIR DADOS INICIAIS
-- =====================================================

-- Inserir roles padrão
INSERT INTO public.roles (name, description, is_system_role) VALUES
('admin', 'Administrador do sistema com acesso total', true),
('mentor', 'Mentor que oferece orientação e conhecimento', true),
('mentee', 'Pessoa que busca mentoria e aprendizado', true);

-- Inserir permissions básicas
INSERT INTO public.permissions (name, description, resource, action) VALUES
-- Permissions para profiles
('profiles.read', 'Visualizar perfis', 'profiles', 'read'),
('profiles.update', 'Atualizar perfis', 'profiles', 'update'),
('profiles.delete', 'Deletar perfis', 'profiles', 'delete'),

-- Permissions para mentorship
('mentorship.create', 'Criar sessões de mentoria', 'mentorship', 'create'),
('mentorship.read', 'Visualizar sessões de mentoria', 'mentorship', 'read'),
('mentorship.update', 'Atualizar sessões de mentoria', 'mentorship', 'update'),

-- Permissions para admin
('admin.users', 'Gerenciar usuários', 'admin', 'users'),
('admin.validations', 'Gerenciar validações', 'admin', 'validations'),
('admin.system', 'Configurações do sistema', 'admin', 'system');

-- Associar permissions aos roles
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.name = 'admin'; -- Admin tem todas as permissions

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.name = 'mentor' AND p.name IN (
    'profiles.read', 'profiles.update', 
    'mentorship.create', 'mentorship.read', 'mentorship.update'
);

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.name = 'mentee' AND p.name IN (
    'profiles.read', 'profiles.update', 
    'mentorship.read'
);

-- =====================================================
-- 10. TRIGGERS E FUNCTIONS
-- =====================================================

-- Function para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER handle_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_validation_requests
    BEFORE UPDATE ON public.validation_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_metadata JSONB;
    first_name TEXT;
    last_name TEXT;
    display_name TEXT;
    user_type TEXT;
BEGIN
    user_metadata := NEW.raw_user_meta_data;
    
    -- Extrair dados do metadata
    first_name := COALESCE(user_metadata->>'first_name', split_part(COALESCE(user_metadata->>'full_name', NEW.email), ' ', 1));
    last_name := COALESCE(user_metadata->>'last_name', split_part(COALESCE(user_metadata->>'full_name', ''), ' ', 2));
    display_name := COALESCE(user_metadata->>'display_name', user_metadata->>'full_name', first_name || ' ' || last_name);
    user_type := COALESCE(user_metadata->>'user_type', 'mentee');

    -- Inserir perfil
    INSERT INTO public.profiles (
        id, 
        email, 
        first_name, 
        last_name,
        role,
        verification_status,
        status
    ) VALUES (
        NEW.id,
        NEW.email,
        first_name,
        COALESCE(NULLIF(last_name, ''), 'User'),
        user_type::public.user_role,
        CASE 
            WHEN user_type = 'mentor' THEN 'pending_validation'::public.verification_status
            ELSE 'active'::public.verification_status
        END,
        'active'::public.user_status
    );

    -- Associar role padrão
    INSERT INTO public.user_roles (user_id, role_id)
    SELECT NEW.id, r.id FROM public.roles r WHERE r.name = user_type;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 11. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin' AND ur.is_active = true
        )
    );

-- Policies para validation_requests
CREATE POLICY "Users can view their own validation requests" ON public.validation_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own validation requests" ON public.validation_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all validation requests" ON public.validation_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin' AND ur.is_active = true
        )
    );

-- Policies para roles e permissions (somente leitura para usuários autenticados)
CREATE POLICY "Authenticated users can view roles" ON public.roles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view permissions" ON public.permissions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view role permissions" ON public.role_permissions
    FOR SELECT USING (auth.role() = 'authenticated');

-- =====================================================
-- 12. FUNCTIONS AUXILIARES
-- =====================================================

-- Function para obter roles do usuário
CREATE OR REPLACE FUNCTION public.get_user_roles(user_uuid UUID)
RETURNS TEXT[] AS $$
DECLARE
    user_roles TEXT[];
BEGIN
    SELECT ARRAY_AGG(r.name) INTO user_roles
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid AND ur.is_active = true;
    
    RETURN COALESCE(user_roles, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function para verificar permission
CREATE OR REPLACE FUNCTION public.user_has_permission(user_uuid UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := false;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM public.user_roles ur
        JOIN public.role_permissions rp ON ur.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = user_uuid 
        AND ur.is_active = true 
        AND p.name = permission_name
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SCRIPT CONCLUÍDO
-- =====================================================

-- Verificar se tudo foi criado corretamente
SELECT 'RBAC System setup completed successfully!' as status;

-- Mostrar estatísticas
SELECT 
    'Roles: ' || COUNT(*) as roles_count
FROM public.roles
UNION ALL
SELECT 
    'Permissions: ' || COUNT(*) as permissions_count
FROM public.permissions
UNION ALL
SELECT 
    'Role Permissions: ' || COUNT(*) as role_permissions_count
FROM public.role_permissions;
