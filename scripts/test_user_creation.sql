-- Test script to verify user creation is working
-- Check if functions exist
SELECT 'Functions Check' as test_type, COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('handle_new_user', 'custom_access_token_hook', 'get_user_permissions', 'user_has_permission');

-- Check if triggers exist
SELECT 'Triggers Check' as test_type, COUNT(*) as count
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE t.tgname = 'on_auth_user_created';

-- Check profiles table structure
SELECT 'Profiles Columns' as test_type, COUNT(*) as count
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name IN ('id', 'email', 'first_name', 'last_name', 'full_name', 'role', 'status', 'verification_status');

-- Check if roles and permissions are populated
SELECT 'Roles Count' as test_type, COUNT(*) as count FROM public.roles;
SELECT 'Permissions Count' as test_type, COUNT(*) as count FROM public.permissions;
SELECT 'Role Mappings Count' as test_type, COUNT(*) as count FROM public.role_permissions;