-- =============================================
-- SCRIPT COMPLETO PARA CONFIGURAÇÃO DO BANCO
-- =============================================

-- Limpar dados existentes (cuidado em produção!)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view validation requests" ON validation_requests;
DROP POLICY IF EXISTS "Admins can manage validation requests" ON validation_requests;

DROP FUNCTION IF EXISTS create_user_profile();
DROP FUNCTION IF EXISTS is_admin(uuid);
DROP FUNCTION IF EXISTS handle_new_user();

DROP TABLE IF EXISTS validation_requests;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS profiles;

DROP TYPE IF EXISTS user_role_enum;

-- =============================================
-- 1. CRIAÇÃO DE TIPOS ENUM
-- =============================================

CREATE TYPE user_role_enum AS ENUM ('mentor', 'mentee', 'admin');

-- =============================================
-- 2. CRIAÇÃO DAS TABELAS
-- =============================================

-- Tabela de perfis dos usuários
CREATE TABLE profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    bio TEXT,
    role user_role_enum DEFAULT 'mentee',
    is_validated BOOLEAN DEFAULT FALSE,
    location TEXT,
    skills TEXT[],
    experience_level TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    website_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de roles dos usuários (abordagem escalável)
CREATE TABLE user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id, role)
);

-- Tabela de solicitações de validação
CREATE TABLE validation_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    review_notes TEXT,
    UNIQUE(user_id, profile_id)
);

-- =============================================
-- 3. ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_is_validated ON profiles(is_validated);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_validation_requests_status ON validation_requests(status);
CREATE INDEX idx_validation_requests_user_id ON validation_requests(user_id);

-- =============================================
-- 4. FUNÇÕES AUXILIARES
-- =============================================

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = user_uuid 
        AND role = 'admin'
        AND is_validated = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar perfil do usuário
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS trigger AS $$
BEGIN
    INSERT INTO profiles (user_id, name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Criar solicitação de validação automaticamente
    INSERT INTO validation_requests (user_id, profile_id)
    SELECT NEW.id, p.id
    FROM profiles p
    WHERE p.user_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 5. TRIGGERS
-- =============================================

-- Trigger para criar perfil automaticamente quando usuário se registra
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Trigger para atualizar timestamp
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS nas tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_requests ENABLE ROW LEVEL SECURITY;

-- Policies para tabela profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles" ON profiles
    FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Public profiles are viewable" ON profiles
    FOR SELECT USING (is_validated = true);

-- Policies para tabela user_roles
CREATE POLICY "Users can view own roles" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON user_roles
    FOR ALL USING (is_admin(auth.uid()));

-- Policies para tabela validation_requests
CREATE POLICY "Admins can view validation requests" ON validation_requests
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage validation requests" ON validation_requests
    FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can view own validation requests" ON validation_requests
    FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- 7. INSERIR DADOS INICIAIS
-- =============================================

-- Inserir um admin inicial (substitua pelo seu email)
-- IMPORTANTE: Execute isso após criar sua conta
/*
UPDATE profiles 
SET role = 'admin', is_validated = true 
WHERE user_id = (
    SELECT id FROM auth.users 
    WHERE email = 'seu-email@exemplo.com'
);
*/

-- =============================================
-- 8. CONFIGURAÇÃO DE STORAGE (OPCIONAL)
-- =============================================

-- Bucket para avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policy para upload de avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- =============================================
-- COMENTÁRIOS PARA REMOÇÃO POSTERIOR
-- =============================================

/*
INSTRUÇÕES PARA USO:

1. Execute este script no SQL Editor do Supabase
2. Configure as variáveis de ambiente no seu projeto Next.js
3. Após criar sua primeira conta, execute o UPDATE para se tornar admin
4. Configure OAuth providers no Supabase Dashboard
5. Teste o fluxo completo de registro/login

VARIÁVEIS DE AMBIENTE NECESSÁRIAS:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (para operações admin)

PRÓXIMOS PASSOS:
- Configurar OAuth (Google, LinkedIn)
- Testar fluxo de onboarding
- Implementar validação manual
- Configurar middleware de autenticação
*/
