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

user_role AS ENUM (
    'mentee',       -- User seeking mentorship
    'mentor',       -- User providing mentorship
    'admin',        -- System administrator
    'volunteer',    -- Platform volunteer
    'moderator'     -- Content moderator
);

ENUM status (
    'pending',      -- Account pending activation
    'active',       -- Active account
    'suspended',    -- Temporarily suspended
    'rejected'      -- Account rejected/banned
);

verification AS ENUM (
    'pending',              -- Initial state
    'pending_validation',   -- Mentor awaiting validation
    'active',              -- Verified and active
    'rejected'             -- Verification rejected
);


CREATE TABLE public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

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
    role_name TEXT,
    permission_name TEXT,
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
    role public.user_role DEFAULT '' NOT NULL,
    status public.user_status DEFAULT 'pending' NOT NULL, ativo apos confirmar e-mail, talvez nao precise disso.
    verification_status public.verification_status DEFAULT 'pending' NOT NULL,
    
    -- Professional information (mainly for mentors)
    expertise_areas TEXT[],
    school
    current_work
    
    linkedin_url TEXT,
    portifolio_url TEXT,
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

