-- Verificar se as políticas RLS foram criadas corretamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename IN ('roles', 'user_roles', 'profiles')
ORDER BY tablename, policyname;

-- Verificar se as tabelas existem e têm dados
SELECT 'roles' as table_name, COUNT(*) as count FROM public.roles
UNION ALL
SELECT 'profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'user_roles' as table_name, COUNT(*) as count FROM public.user_roles;

-- Verificar se existem roles básicas
SELECT id, name, description FROM public.roles ORDER BY name;