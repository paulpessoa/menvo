-- =================================================================
-- CLEANUP OBSOLETE STRUCTURES - Auth Refactor MVP
-- Remove complex structures and prepare for simplified schema
-- =================================================================

-- Drop existing functions that will be replaced
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

-- Drop existing types that are too complex for MVP
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.user_status CASCADE;
DROP TYPE IF EXISTS public.verification_status CASCADE;

-- Drop any existing policies (only if tables exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
        DROP POLICY IF EXISTS "Public can view verified mentors" ON public.profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
        DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
        DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;
    END IF;
END $$;

-- Drop any existing triggers (only if tables exist)
DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
        DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
    END IF;
END $$;

-- Drop any existing indexes that will be recreated
DROP INDEX IF EXISTS idx_profiles_slug;
DROP INDEX IF EXISTS idx_profiles_verified;
DROP INDEX IF EXISTS idx_profiles_role;
DROP INDEX IF EXISTS idx_user_roles_user_id;
DROP INDEX IF EXISTS idx_user_roles_role_id;

-- Clean up storage buckets if they exist with wrong configuration
DELETE FROM storage.buckets WHERE id = 'avatars';
