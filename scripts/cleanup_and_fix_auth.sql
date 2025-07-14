-- =============================================
-- SCRIPT COMPLETO DE CONFIGURAÇÃO DE AUTENTICAÇÃO
-- =============================================

-- 1. Limpar e recriar tabelas se necessário
DROP TABLE IF EXISTS volunteer_activities CASCADE;
DROP TABLE IF EXISTS mentorship_sessions CASCADE;
DROP TABLE IF EXISTS mentor_profiles CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;

-- 2. Criar enum para roles se não existir
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('pending', 'mentee', 'mentor', 'admin', 'volunteer', 'moderator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Recriar tabela profiles com estrutura completa
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    linkedin_url TEXT,
    presentation_video_url TEXT,
    expertise_areas TEXT,
    role user_role DEFAULT 'pending' NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    verification_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Criar tabela de perfis de mentores
CREATE TABLE mentor_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    availability TEXT DEFAULT 'available' CHECK (availability IN ('available', 'busy', 'unavailable')),
    hourly_rate DECIMAL(10,2),
    languages TEXT[] DEFAULT ARRAY['pt-BR'],
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    meeting_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Criar tabela de sessões de mentoria
CREATE TABLE mentorship_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mentor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    mentee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rejected')),
    meeting_url TEXT,
    notes TEXT,
    feedback_mentor TEXT,
    feedback_mentee TEXT,
    rating_mentor INTEGER CHECK (rating_mentor >= 1 AND rating_mentor <= 5),
    rating_mentee INTEGER CHECK (rating_mentee >= 1 AND rating_mentee <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Criar tabela de atividades de voluntariado
CREATE TABLE volunteer_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    description TEXT,
    hours DECIMAL(5,2) NOT NULL CHECK (hours > 0),
    date DATE NOT NULL,
    location TEXT,
    organization TEXT,
    evidence_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected')),
    validated_by UUID REFERENCES profiles(id),
    validated_at TIMESTAMPTZ,
    validation_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Criar tabela de notificações
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
    category TEXT NOT NULL CHECK (category IN ('system', 'mentorship', 'verification', 'volunteer')),
    read BOOLEAN DEFAULT FALSE,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. Criar índices para performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_verification_status ON profiles(verification_status);
CREATE INDEX idx_profiles_email ON profiles(email);

CREATE INDEX idx_mentor_profiles_user_id ON mentor_profiles(user_id);
CREATE INDEX idx_mentor_profiles_availability ON mentor_profiles(availability);

CREATE INDEX idx_mentorship_sessions_mentor_id ON mentorship_sessions(mentor_id);
CREATE INDEX idx_mentorship_sessions_mentee_id ON mentorship_sessions(mentee_id);
CREATE INDEX idx_mentorship_sessions_status ON mentorship_sessions(status);
CREATE INDEX idx_mentorship_sessions_scheduled_at ON mentorship_sessions(scheduled_at);

CREATE INDEX idx_volunteer_activities_user_id ON volunteer_activities(user_id);
CREATE INDEX idx_volunteer_activities_status ON volunteer_activities(status);
CREATE INDEX idx_volunteer_activities_date ON volunteer_activities(date);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- 9. Configurar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 10. Políticas RLS para profiles
CREATE POLICY "Usuários podem ver perfis públicos" ON profiles
    FOR SELECT USING (
        status = 'active' OR 
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Usuários podem atualizar próprio perfil" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins podem gerenciar todos os perfis" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
        )
    );

-- 11. Políticas RLS para mentor_profiles
CREATE POLICY "Mentores podem ver próprio perfil" ON mentor_profiles
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Mentores podem atualizar próprio perfil" ON mentor_profiles
    FOR UPDATE USING (user_id = auth.uid());

-- 12. Políticas RLS para mentorship_sessions
CREATE POLICY "Participantes podem ver sessões" ON mentorship_sessions
    FOR SELECT USING (
        mentor_id = auth.uid() OR 
        mentee_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Participantes podem atualizar sessões" ON mentorship_sessions
    FOR UPDATE USING (mentor_id = auth.uid() OR mentee_id = auth.uid());

CREATE POLICY "Mentorados podem criar sessões" ON mentorship_sessions
    FOR INSERT WITH CHECK (mentee_id = auth.uid());

-- 13. Políticas RLS para volunteer_activities
CREATE POLICY "Voluntários podem ver próprias atividades" ON volunteer_activities
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Voluntários podem criar atividades" ON volunteer_activities
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Voluntários podem atualizar próprias atividades" ON volunteer_activities
    FOR UPDATE USING (user_id = auth.uid());

-- 14. Políticas RLS para notifications
CREATE POLICY "Usuários podem ver próprias notificações" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar próprias notificações" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- 15. Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, status, verification_status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'pending',
        'pending',
        'pending'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 17. Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 18. Triggers para updated_at
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER mentor_profiles_updated_at BEFORE UPDATE ON mentor_profiles
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER mentorship_sessions_updated_at BEFORE UPDATE ON mentorship_sessions
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER volunteer_activities_updated_at BEFORE UPDATE ON volunteer_activities
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 19. Inserir usuário admin padrão (substitua pelo seu email)
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'admin@menvo.com.br', -- SUBSTITUA PELO SEU EMAIL
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Administrador"}',
    false,
    'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- 20. Atualizar perfil do admin
UPDATE profiles 
SET role = 'admin', status = 'active', verification_status = 'verified'
WHERE email = 'admin@menvo.com.br';

-- 21. Configurar storage bucket para avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 22. Política de storage para avatars
CREATE POLICY "Usuários podem fazer upload de avatars" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatars são públicos" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Usuários podem atualizar próprios avatars" ON storage.objects
    FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários podem deletar próprios avatars" ON storage.objects
    FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 23. Função para notificações
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_type TEXT DEFAULT 'info',
    p_category TEXT DEFAULT 'system',
    p_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, title, message, type, category, data)
    VALUES (p_user_id, p_title, p_message, p_type, p_category, p_data)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 24. Função para estatísticas do dashboard
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM profiles),
        'pending_verifications', (SELECT COUNT(*) FROM profiles WHERE role = 'mentor' AND verification_status = 'pending'),
        'total_mentors', (SELECT COUNT(*) FROM profiles WHERE role = 'mentor'),
        'active_mentors', (SELECT COUNT(*) FROM profiles WHERE role = 'mentor' AND status = 'active'),
        'total_volunteers', (SELECT COUNT(*) FROM profiles WHERE role = 'volunteer'),
        'pending_activities', (SELECT COUNT(*) FROM volunteer_activities WHERE status = 'pending'),
        'total_sessions', (SELECT COUNT(*) FROM mentorship_sessions),
        'completed_sessions', (SELECT COUNT(*) FROM mentorship_sessions WHERE status = 'completed')
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 25. Conceder permissões necessárias
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- =============================================
-- SCRIPT CONCLUÍDO COM SUCESSO!
-- =============================================

-- Para verificar se tudo foi criado corretamente:
SELECT 
    'profiles' as table_name, 
    COUNT(*) as count 
FROM profiles
UNION ALL
SELECT 
    'mentor_profiles' as table_name, 
    COUNT(*) as count 
FROM mentor_profiles
UNION ALL
SELECT 
    'mentorship_sessions' as table_name, 
    COUNT(*) as count 
FROM mentorship_sessions
UNION ALL
SELECT 
    'volunteer_activities' as table_name, 
    COUNT(*) as count 
FROM volunteer_activities
UNION ALL
SELECT 
    'notifications' as table_name, 
    COUNT(*) as count 
FROM notifications;

-- Verificar se o usuário admin foi criado
SELECT email, role, status, verification_status 
FROM profiles 
WHERE email = 'admin@menvo.com.br';
