-- Verificar se o trigger foi criado na produção
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing,
  event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'handle_new_user';

-- Verificar se a função existe
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Contar usuários e perfis na produção
SELECT 'auth.users' as table_name, COUNT(*) as total FROM auth.users
UNION ALL
SELECT 'public.profiles' as table_name, COUNT(*) as total FROM public.profiles;