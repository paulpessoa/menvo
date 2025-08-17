-- =================================================================
-- CLEANUP ORPHANED DATA
-- This script removes orphaned profiles and inconsistent data
-- Execute this in Supabase SQL Editor to fix the duplicate key issue
-- =================================================================

-- 1. Remove orphaned profiles (profiles without corresponding auth.users)
DELETE FROM public.profiles 
WHERE id NOT IN (SELECT id FROM auth.users);

-- 2. Remove orphaned user_roles
DELETE FROM public.user_roles 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- 3. Remove orphaned validation_requests
DELETE FROM public.validation_requests 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- 4. Show cleanup results
SELECT 
    'Cleanup Results' as status,
    (SELECT COUNT(*) FROM public.profiles) as profiles_count,
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public.user_roles) as user_roles_count,
    (SELECT COUNT(*) FROM public.validation_requests) as validation_requests_count;

-- 5. Verify no orphaned data remains
SELECT 
    'Orphaned Profiles Check' as check_type,
    COUNT(*) as count
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.id IS NULL;

SELECT 'Cleanup completed successfully!' as message;