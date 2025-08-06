-- =============================================
-- SCRIPT COMPLETO PARA CONFIGURAÇÃO DO BANCO
-- Mentor Connect - Sistema de Mentoria
-- =============================================

-- Limpar dados existentes (cuidado em produção!)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable" ON profiles;
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view validation requests" ON validation_requests;
DROP POLICY IF EXISTS "Admins can manage validation requests" ON validation_requests;
DROP POLICY IF EXISTS "Users can view own validation requests" ON validation_requests;

DROP FUNCTION IF EXISTS create_user_profile();
DROP FUNCTION IF EXISTS is_admin(uuid);
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at_column();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

DROP TABLE IF EXISTS validation_requests CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP TYPE IF EXISTS user_role_enum;
DROP TYPE IF EXISTS validation_status_enum;

-- =============================================
-- 1. CRIAÇÃO DE TIPOS ENUM
-- =============================================

CREATE TYPE user_role_enum AS ENUM ('mentor', 'mentee', 'admin');
CREATE TYPE validation_status_enum AS ENUM ('pending', 'approved', 'rejected');

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
    skills TEXT[] DEFAULT '{}',
    experience_level TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    website_url TEXT,
    phone TEXT,
    company TEXT,
    position TEXT,
    years_of_experience INTEGER,
    languages TEXT[] DEFAULT '{}',
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    availability_hours JSONB DEFAULT '{}',
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
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, role)
);

-- Tabela de solicitações de validação
CREATE TABLE validation_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    status validation_status_enum DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    review_notes TEXT,
    additional_info JSONB DEFAULT '{}',
    UNIQUE(user_id, profile_id)
);

-- =============================================
-- 3. ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_is_validated ON profiles(is_validated);
CREATE INDEX idx_profiles_location ON profiles(location);
CREATE INDEX idx_profiles_skills ON profiles USING GIN(skills);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_validation_requests_status ON validation_requests(status);
CREATE INDEX idx_validation_requests_user_id ON validation_requests(user_id);
CREATE INDEX idx_validation_requests_reviewed_by ON validation_requests(reviewed_by);

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

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar perfil do usuário automaticamente
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS trigger AS $$
DECLARE
    user_name TEXT;
    user_avatar TEXT;
BEGIN
    -- Extrair nome do metadata
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    
    -- Extrair avatar do metadata
    user_avatar := NEW.raw_user_meta_data->>'avatar_url';
    
    -- Inserir perfil
    INSERT INTO profiles (user_id, name, avatar_url)
    VALUES (NEW.id, user_name, user_avatar);
    
    -- Criar solicitação de validação automaticamente
    INSERT INTO validation_requests (user_id, profile_id)
    SELECT NEW.id, p.id
    FROM profiles p
    WHERE p.user_id = NEW.id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log do erro (em produção, use um sistema de log adequado)
        RAISE LOG 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
-- 7. CONFIGURAÇÃO DE STORAGE
-- =============================================

-- Criar bucket para avatars se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies para storage de avatars
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

CREATE POLICY "Users can delete their own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- =============================================
-- 8. DADOS INICIAIS (OPCIONAL)
-- =============================================

-- Inserir tipos de atividades voluntárias padrão
INSERT INTO volunteer_activity_types (name, description, icon, color) VALUES
('Ensino', 'Atividades relacionadas ao ensino e educação', '📚', '#3B82F6'),
('Tecnologia', 'Desenvolvimento de software e tecnologia', '💻', '#10B981'),
('Saúde', 'Atividades na área da saúde', '🏥', '#EF4444'),
('Meio Ambiente', 'Projetos ambientais e sustentabilidade', '🌱', '#22C55E'),
('Assistência Social', 'Trabalho social e comunitário', '🤝', '#F59E0B'),
('Cultura', 'Atividades culturais e artísticas', '🎨', '#8B5CF6'),
('Esportes', 'Atividades esportivas e recreativas', '⚽', '#06B6D4'),
('Outros', 'Outras atividades voluntárias', '📋', '#6B7280')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 9. COMENTÁRIOS E INSTRUÇÕES
-- =============================================

/*
INSTRUÇÕES PARA CONFIGURAÇÃO:

1. EXECUTAR ESTE SCRIPT:
   - Copie e cole este script no SQL Editor do Supabase
   - Execute o script completo

2. CONFIGURAR PRIMEIRO ADMIN:
   - Crie sua conta normalmente pela aplicação
   - Execute o comando abaixo substituindo seu email:
   
   UPDATE profiles 
   SET role = 'admin', is_validated = true 
   WHERE user_id = (
       SELECT id FROM auth.users 
       WHERE email = 'seu-email@exemplo.com'
   );

3. CONFIGURAR OAUTH:
   - Vá em Authentication > Providers no Supabase Dashboard
   - Configure Google OAuth com suas credenciais
   - Configure LinkedIn OAuth com suas credenciais
   - URLs de callback: https://seudominio.com/auth/callback

4. VARIÁVEIS DE AMBIENTE:
   - NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
   - NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
   - SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico (para operações admin)

5. TESTAR O FLUXO:
   - Registre um novo usuário
   - Verifique se o perfil foi criado automaticamente
   - Teste o processo de onboarding
   - Teste a validação manual no painel admin

ESTRUTURA DAS TABELAS:
- profiles: Informações do perfil do usuário
- user_roles: Sistema de roles escalável
- validation_requests: Solicitações de validação manual

SEGURANÇA:
- RLS habilitado em todas as tabelas
- Policies configuradas para acesso seguro
- Funções com SECURITY DEFINER para operações privilegiadas

PRÓXIMOS PASSOS:
- Implementar notificações por email
- Adicionar sistema de avaliações
- Criar dashboard de analytics
- Implementar chat em tempo real
*/

-- Verificar se tudo foi criado corretamente
SELECT 
    'Tabelas criadas:' as status,
    COUNT(*) as total
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'user_roles', 'validation_requests');

SELECT 
    'Policies criadas:' as status,
    COUNT(*) as total
FROM pg_policies 
WHERE schemaname = 'public';

SELECT 
    'Functions criadas:' as status,
    COUNT(*) as total
FROM pg_proc 
WHERE proname IN ('is_admin', 'create_user_profile', 'update_updated_at_column');
