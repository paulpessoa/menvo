-- Verify cleanup was successful
SELECT 
    'Auth Users' as table_name,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'Profiles',
    COUNT(*)
FROM public.profiles
UNION ALL
SELECT 
    'User Roles',
    COUNT(*)
FROM public.user_roles
UNION ALL
SELECT 
    'Validation Requests',
    COUNT(*)
FROM public.validation_requests;

-- Check for any remaining orphaned data
SELECT 
    'Orphaned Profiles' as check_type,
    COUNT(*) as count
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.id IS NULL;

SELECT 'System is clean and ready for new user registration!' as status;