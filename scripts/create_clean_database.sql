-- =====================================================
-- MENVO - Clean Database Setup
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. ENUMS
-- =====================================================

-- User role enum
CREATE TYPE user_role AS ENUM ('admin', 'mentor', 'mentee');

-- User status enum  
CREATE TYPE user_status AS ENUM ('pending', 'active', 'inactive', 'suspended');

-- Session status enum
CREATE TYPE session_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- =====================================================
-- 2. CORE TABLES
-- =====================================================

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    role user_role DEFAULT 'mentee',
    status user_status DEFAULT 'pending',
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    website_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
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
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    level INTEGER CHECK (level >= 1 AND level <= 5) DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, skill_id)
);

-- Mentorship sessions
CREATE TABLE mentorship_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    mentee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
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

-- =====================================================
-- 3. INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Sessions indexes
CREATE INDEX idx_sessions_mentor ON mentorship_sessions(mentor_id);
CREATE INDEX idx_sessions_mentee ON mentorship_sessions(mentee_id);
CREATE INDEX idx_sessions_status ON mentorship_sessions(status);
CREATE INDEX idx_sessions_scheduled ON mentorship_sessions(scheduled_at);

-- Skills indexes
CREATE INDEX idx_user_skills_user ON user_skills(user_id);
CREATE INDEX idx_user_skills_skill ON user_skills(skill_id);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. BASIC POLICIES
-- =====================================================

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Skills policies (public read)
CREATE POLICY "Skills are viewable by everyone" ON skills
    FOR SELECT USING (true);

-- User skills policies
CREATE POLICY "User skills are viewable by everyone" ON user_skills
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own skills" ON user_skills
    FOR ALL USING (auth.uid() = user_id);

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

-- =====================================================
-- 6. FUNCTIONS
-- =====================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    first_name TEXT;
    last_name TEXT;
    full_name TEXT;
    user_type TEXT;
BEGIN
    -- Extract data from metadata
    first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', 'User');
    last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
    full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', CONCAT(first_name, ' ', last_name));
    user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'mentee');

    -- Insert into profiles
    INSERT INTO profiles (id, email, first_name, last_name, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        first_name,
        last_name,
        full_name,
        user_type::user_role
    );
    
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

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Trigger for new user registration
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
    ('Design', 'Creative')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
