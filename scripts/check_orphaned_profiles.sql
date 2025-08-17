-- Check for orphaned profiles (profiles without corresponding auth.users)
SELECT 
    'Orphaned Profiles' as issue_type,
    COUNT(*) as count,
    string_agg(email, ', ') as emails
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.id IS NULL;

-- Check for users without profiles
SELECT 
    'Users Without Profiles' as issue_type,
    COUNT(*) as count,
    string_agg(email, ', ') as emails
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Show all profiles
SELECT 
    'All Profiles' as info_type,
    COUNT(*) as count
FROM public.profiles;

-- Show all auth users
SELECT 
    'All Auth Users' as info_type,
    COUNT(*) as count
FROM auth.users;