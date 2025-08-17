-- =================================================================
-- MENVO - CONSOLIDATED AUTHENTICATION SCHEMA (SIMPLIFIED)
-- This script creates the complete authentication system from scratch
-- =================================================================

-- =================================================================
-- 1. CLEANUP EXISTING CONFLICTING STRUCTURES
-- =================================================================

-- Drop existing functions that might conflict
DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.generate_profile_slug() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_roles(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.user_has_permission(uuid, text) CASCADE;

-- Drop existing tables (in correct order to handle dependencies)
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.validation_requests CASCADE;
DROP TABLE IF EXISTS public.mentor_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.user_status CASCADE;
DROP TYPE IF EXISTS public.verification_status CASCADE;

-- =================================================================
-- 2. CREATE ENUM TYPES
-- =================================================================

CREATE TYPE public.user_role AS ENUM (
    'pending',      -- User hasn't selected a role yet (OAuth users)
    'mentee',       -- User seeking mentorship
    'mentor',       -- User providing mentorship
    'admin',        -- System administrator
    'volunteer',    -- Platform volunteer
    'moderator'     -- Content moderator
);

CREATE TYPE public.user_status AS ENUM (
    'pending',      -- Account pending activation
    'active',       -- Active account
    'suspended',    -- Temporarily suspended
    'rejected'      -- Account rejected/banned
);

CREATE TYPE public.verification_status AS ENUM (
    'pending',              -- Initial state
    'pending_validation',   -- Mentor awaiting validation
    'active',              -- Verified and active
    'rejected'             -- Verification rejected
);

-- =================================================================
-- 3. CREATE RBAC TABLES
-- =================================================================

-- Roles table
CREATE TABLE public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Permissions table
CREATE TABLE public.permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Role-Permission mapping table
CREATE TABLE public.role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (role_id, permission_id)
);

-- =================================================================
-- 4. CREATE MAIN PROFILES TABLE
-- =================================================================

CREATE TABLE public.profiles (
    -- Core identity
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    
    -- Personal information
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    slug TEXT UNIQUE,
    
    -- Profile information
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    
    -- Role and status
    role public.user_role DEFAULT 'pending' NOT NULL,
    status public.user_status DEFAULT 'pending' NOT NULL,
    verification_status public.verification_status DEFAULT 'pending' NOT NULL,
    
    -- Professional information (mainly for mentors)
    expertise_areas TEXT[],
    linkedin_url TEXT,
    github_url TEXT,
    website_url TEXT,
    
    -- Settings
    is_available BOOLEAN DEFAULT true,
    timezone TEXT,
    
    -- Verification
    verified_at TIMESTAMPTZ,
    verification_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User-Role assignments table (for flexible RBAC)
CREATE TABLE public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
    is_primary BOOLEAN DEFAULT true,
    assigned_by UUID REFERENCES public.profiles(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ,
    UNIQUE (user_id, role_id)
);

-- Validation requests table (for mentor verification)
CREATE TABLE public.validation_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    request_type TEXT NOT NULL DEFAULT 'mentor_verification',
    status TEXT DEFAULT 'pending',
    data JSONB,
    submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id),
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =================================================================
-- 5. INSERT DEFAULT ROLES AND PERMISSIONS
-- =================================================================

-- Insert system roles
INSERT INTO public.roles (name, description, is_system_role) VALUES
    ('pending', 'User with incomplete registration', true),
    ('mentee', 'User seeking mentorship', true),
    ('mentor', 'User providing mentorship', true),
    ('admin', 'System administrator with full access', true),
    ('volunteer', 'Platform volunteer', true),
    ('moderator', 'Content and verification moderator', true);

-- Insert permissions
INSERT INTO public.permissions (name, description, resource, action) VALUES
    -- Profile permissions
    ('view_mentors', 'View mentor profiles', 'profiles', 'read'),
    ('view_profiles', 'View user profiles', 'profiles', 'read'),
    ('update_own_profile', 'Update own profile', 'profiles', 'update'),
    
    -- Mentorship permissions
    ('book_sessions', 'Book mentorship sessions', 'mentorship', 'create'),
    ('provide_mentorship', 'Provide mentorship services', 'mentorship', 'create'),
    ('manage_availability', 'Manage mentor availability', 'mentorship', 'update'),
    
    -- Admin permissions
    ('admin_users', 'Administer user accounts', 'admin', 'users'),
    ('admin_verifications', 'Handle profile verifications', 'admin', 'verifications'),
    ('admin_system', 'Full system administration', 'admin', 'system'),
    ('manage_roles', 'Manage user roles and permissions', 'admin', 'roles'),
    
    -- Volunteer permissions
    ('validate_activities', 'Validate volunteer activities', 'volunteer', 'validate'),
    
    -- Moderation permissions
    ('moderate_content', 'Moderate platform content', 'moderation', 'content'),
    ('moderate_verifications', 'Moderate verification requests', 'moderation', 'verifications');

-- Map permissions to roles
-- Admin gets all permissions
INSERT INTO public.role_permissions (role_id, permission_id) 
SELECT r.id, p.id FROM public.roles r, public.permissions p WHERE r.name = 'admin';

-- Mentor permissions
INSERT INTO public.role_permissions (role_id, permission_id) 
SELECT r.id, p.id FROM public.roles r, public.permissions p 
WHERE r.name = 'mentor' AND p.name IN ('view_mentors', 'view_profiles', 'update_own_profile', 'provide_mentorship', 'manage_availability');

-- Mentee permissions
INSERT INTO public.role_permissions (role_id, permission_id) 
SELECT r.id, p.id FROM public.roles r, public.permissions p 
WHERE r.name = 'mentee' AND p.name IN ('view_mentors', 'view_profiles', 'update_own_profile', 'book_sessions');

-- Moderator permissions
INSERT INTO public.role_permissions (role_id, permission_id) 
SELECT r.id, p.id FROM public.roles r, public.permissions p 
WHERE r.name = 'moderator' AND p.name IN ('view_mentors', 'view_profiles', 'moderate_content', 'moderate_verifications', 'admin_verifications');

-- Volunteer permissions
INSERT INTO public.role_permissions (role_id, permission_id) 
SELECT r.id, p.id FROM public.roles r, public.permissions p 
WHERE r.name = 'volunteer' AND p.name IN ('view_mentors', 'view_profiles', 'validate_activities');

-- =================================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- =================================================================

-- Profiles table indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_status ON public.profiles(status);
CREATE INDEX idx_profiles_verification_status ON public.profiles(verification_status);
CREATE INDEX idx_profiles_slug ON public.profiles(slug);

-- User roles indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON public.user_roles(role_id);
CREATE INDEX idx_user_roles_is_primary ON public.user_roles(is_primary);

-- Role permissions indexes
CREATE INDEX idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions(permission_id);

-- Validation requests indexes
CREATE INDEX idx_validation_requests_user_id ON public.validation_requests(user_id);
CREATE INDEX idx_validation_requests_status ON public.validation_requests(status);
CREATE INDEX idx_validation_requests_request_type ON public.validation_requests(request_type);

-- =================================================================
-- 7. CONFIGURE ROW LEVEL SECURITY (RLS)
-- =================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validation_requests ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (we'll add the functions later)
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public can view verified mentor profiles" ON public.profiles
    FOR SELECT USING (
        role = 'mentor' AND 
        status = 'active' AND 
        verification_status = 'active'
    );

-- Roles and permissions RLS policies (read-only for authenticated users)
CREATE POLICY "Authenticated users can view roles" ON public.roles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view permissions" ON public.permissions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view role permissions" ON public.role_permissions
    FOR SELECT USING (auth.role() = 'authenticated');

-- User roles RLS policies
CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Validation requests RLS policies
CREATE POLICY "Users can view own validation requests" ON public.validation_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own validation requests" ON public.validation_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =================================================================
-- 8. GRANT NECESSARY PERMISSIONS
-- =================================================================

-- Grant usage on schema and tables to authenticated users
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT SELECT ON public.roles TO authenticated;
GRANT SELECT ON public.permissions TO authenticated;
GRANT SELECT ON public.role_permissions TO authenticated;

-- Grant specific permissions for profile management
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT INSERT, SELECT ON public.validation_requests TO authenticated;