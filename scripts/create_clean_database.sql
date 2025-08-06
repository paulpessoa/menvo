-- =====================================================
-- MENVO - Clean Database Setup with Authentication & Roles
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. ENUMS
-- =====================================================

-- User role enum (mentor ou mentee como solicitado)
CREATE TYPE user_role AS ENUM ('mentor', 'mentee');

-- User status enum  
CREATE TYPE user_status AS ENUM ('pending', 'active', 'inactive', 'suspended');

-- Session status enum
CREATE TYPE session_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- Validation status enum
CREATE TYPE validation_status AS ENUM ('pending', 'approved', 'rejected');

-- =====================================================
-- 2. CORE TABLES
-- =====================================================

-- Profiles table (extends auth.users) - Seguindo especificação do prompt
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    role user_role NOT NULL, -- mentor ou mentee como solicitado
    is_validated BOOLEAN DEFAULT FALSE, -- Campo de validação manual como solicitado
    location TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    website_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles table (abordagem mais escalável como mencionado no prompt)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, role)
);

-- Skills table
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User skills (many-to-many)
CREATE TABLE user_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    level INTEGER CHECK (level >= 1 AND level <= 5) DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, skill_id)
);

-- Mentorship sessions
CREATE TABLE mentorship_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mentee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status session_status DEFAULT 'pending',
    meeting_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Waiting list table
CREATE TABLE waiting_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    user_type user_role DEFAULT 'mentee',
    skills TEXT[],
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin validation requests (para processo de validação manual)
CREATE TABLE validation_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_data JSONB NOT NULL,
    status validation_status DEFAULT 'pending',
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_is_validated ON profiles(is_validated);
CREATE INDEX idx_profiles_email ON profiles(email);

-- User roles indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_roles_active ON user_roles(is_active);

-- Sessions indexes
CREATE INDEX idx_sessions_mentor ON mentorship_sessions(mentor_id);
CREATE INDEX idx_sessions_mentee ON mentorship_sessions(mentee_id);
CREATE INDEX idx_sessions_status ON mentorship_sessions(status);
CREATE INDEX idx_sessions_scheduled ON mentorship_sessions(scheduled_at);

-- Skills indexes
CREATE INDEX idx_user_skills_user ON user_skills(user_id);
CREATE INDEX idx_user_skills_skill ON user_skills(skill_id);

-- Validation requests indexes
CREATE INDEX idx_validation_requests_user ON validation_requests(user_id);
CREATE INDEX idx_validation_requests_status ON validation_requests(status);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) - Como solicitado no prompt
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_requests ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. RLS POLICIES - Seguindo especificação do prompt
-- =====================================================

-- Profiles policies - Como especificado no prompt
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Public view for validated mentors (para listagem pública)
CREATE POLICY "Validated mentors are publicly viewable" ON profiles
    FOR SELECT USING (role = 'mentor' AND is_validated = true);

-- User roles policies
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (user_id = auth.uid());

-- Skills policies (public read)
CREATE POLICY "Skills are viewable by everyone" ON skills
    FOR SELECT USING (true);

-- User skills policies
CREATE POLICY "User skills are viewable by profile owner" ON user_skills
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own skills" ON user_skills
    FOR ALL USING (user_id = auth.uid());

-- Sessions policies
CREATE POLICY "Users can view own sessions" ON mentorship_sessions
    FOR SELECT USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);

CREATE POLICY "Users can create sessions" ON mentorship_sessions
    FOR INSERT WITH CHECK (auth.uid() = mentor_id OR auth.uid() = mentee_id);

CREATE POLICY "Users can update own sessions" ON mentorship_sessions
    FOR UPDATE USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);

-- Waiting list policies (insert only)
CREATE POLICY "Anyone can join waiting list" ON waiting_list
    FOR INSERT WITH CHECK (true);

-- Validation requests policies
CREATE POLICY "Users can view own validation requests" ON validation_requests
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create validation requests" ON validation_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 6. FUNCTIONS
-- =====================================================

-- Function to check if user is admin (para validação manual)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = $1 
        AND role = 'admin' 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user registration (NÃO cria perfil automaticamente)
-- O perfil será criado no onboarding como solicitado
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Apenas log do novo usuário, perfil será criado no onboarding
    RAISE LOG 'New user created: %', NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create profile (será chamada via API Route)
CREATE OR REPLACE FUNCTION create_user_profile(
    p_user_id UUID,
    p_name TEXT,
    p_email TEXT,
    p_bio TEXT,
    p_role user_role,
    p_avatar_url TEXT DEFAULT NULL,
    p_location TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    profile_id UUID;
BEGIN
    INSERT INTO profiles (user_id, name, email, bio, role, avatar_url, location)
    VALUES (p_user_id, p_name, p_email, p_bio, p_role, p_avatar_url, p_location)
    RETURNING id INTO profile_id;
    
    -- Criar solicitação de validação
    INSERT INTO validation_requests (user_id, profile_data, status)
    VALUES (p_user_id, jsonb_build_object(
        'name', p_name,
        'email', p_email,
        'bio', p_bio,
        'role', p_role,
        'location', p_location
    ), 'pending');
    
    RETURN profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Trigger for new user registration (não cria perfil automaticamente)
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON mentorship_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. INITIAL DATA
-- =====================================================

-- Insert basic skills
INSERT INTO skills (name, category) VALUES
    ('JavaScript', 'Programming'),
    ('Python', 'Programming'),
    ('React', 'Frontend'),
    ('Node.js', 'Backend'),
    ('SQL', 'Database'),
    ('Leadership', 'Soft Skills'),
    ('Communication', 'Soft Skills'),
    ('Project Management', 'Management'),
    ('Marketing', 'Business'),
    ('Design', 'Creative'),
    ('Data Science', 'Analytics'),
    ('Machine Learning', 'AI'),
    ('DevOps', 'Infrastructure'),
    ('Mobile Development', 'Programming'),
    ('UX/UI Design', 'Design')
ON CONFLICT (name) DO NOTHING;

-- Create admin role for first user (ajustar o UUID conforme necessário)
-- INSERT INTO user_roles (user_id, role) VALUES ('YOUR_ADMIN_USER_ID', 'admin');

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
