-- =================================================================
-- COMPLETE CLEANUP OF OLD AUTH HOOKS
-- Remove all traces of old custom access token hooks
-- =================================================================

-- Drop any remaining functions that might be causing issues
DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb) CASCADE;
DROP FUNCTION IF EXISTS auth.custom_access_token_hook(jsonb) CASCADE;
DROP FUNCTION IF EXISTS extensions.custom_access_token_hook(jsonb) CASCADE;

-- Drop any old auth-related functions
DROP FUNCTION IF EXISTS public.handle_auth_user_new() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_signup() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Clean up any old triggers that might reference these functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users CASCADE;

-- Clean up completed
DO $$
BEGIN
    RAISE NOTICE 'Completed cleanup of old auth hooks and functions';
END $$;

-- Ensure we have clean auth configuration
-- This will help prevent any lingering hook references
COMMENT ON SCHEMA public IS 'Clean auth setup without custom hooks';