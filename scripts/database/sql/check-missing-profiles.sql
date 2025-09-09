-- Verificar usuários do auth.users que não têm perfil correspondente
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created_at,
  au.raw_user_meta_data,
  p.id as profile_id
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;

-- Verificar se o trigger existe
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'handle_new_user';

-- Verificar mentores não verificados
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.verified,
  ur.role_id,
  r.name as role_name
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
LEFT JOIN public.roles r ON ur.role_id = r.id
WHERE r.name = 'mentor' AND p.verified = false;
