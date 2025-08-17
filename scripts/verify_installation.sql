-- =================================================================
-- VERIFICATION SCRIPT
-- Execute this in Supabase SQL Editor to verify everything is working
-- =================================================================

-- Check tables
SELECT 
    'Tables created' as check_type,
    COUNT(*) as count,
    string_agg(table_name, ', ') as details
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'roles', 'permissions', 'role_permissions', 'user_roles', 'validation_requests');

-- Check functions
SELECT 
    'Functions created' as check_type,
    COUNT(*) as count,
    string_agg(proname, ', ') as details
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('handle_new_user', 'custom_access_token_hook', 'update_updated_at_column', 'generate_profile_slug', 'get_user_permissions', 'user_has_permission');

-- Check triggers
SELECT 
    'Triggers created' as check_type,
    COUNT(*) as count,
    string_agg(t.tgname, ', ') as details
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname IN ('public', 'auth')
AND t.tgname IN ('on_auth_user_created', 'generate_profile_slug_trigger', 'update_profiles_updated_at');

-- Check roles and permissions
SELECT 
    'RBAC System' as check_type,
    (SELECT COUNT(*) FROM public.roles) as roles_count,
    (SELECT COUNT(*) FROM public.permissions) as permissions_count,
    (SELECT COUNT(*) FROM public.role_permissions) as mappings_count;

-- Check RLS policies
SELECT 
    'RLS Policies' as check_type,
    COUNT(*) as count,
    string_agg(policyname, ', ') as details
FROM pg_policies 
WHERE schemaname = 'public';

SELECT 'Authentication system setup completed successfully!' as status;