-- =================================================================
-- SCRIPT PARA VERIFICAR O ESTADO ATUAL DO BANCO DE DADOS
-- =================================================================

-- 1. Verificar se as tabelas existem
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'roles', 'permissions', 'role_permissions', 'user_roles', 'validation_requests')
ORDER BY table_name;

-- 2. Verificar estrutura da tabela profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Verificar se existem roles cadastradas
SELECT 
    id,
    name,
    description,
    is_system_role,
    created_at
FROM public.roles
ORDER BY name;

-- 4. Verificar se existem permissions cadastradas
SELECT 
    id,
    name,
    description,
    resource,
    action
FROM public.permissions
ORDER BY name;

-- 5. Verificar mapeamento role_permissions
SELECT 
    r.name as role_name,
    p.name as permission_name,
    p.resource,
    p.action
FROM public.role_permissions rp
JOIN public.roles r ON rp.role_id = r.id
JOIN public.permissions p ON rp.permission_id = p.id
ORDER BY r.name, p.name;

-- 6. Verificar usuários existentes e suas roles
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role as profile_role,
    p.status,
    p.verification_status,
    ur.is_primary,
    r.name as assigned_role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
LEFT JOIN public.roles r ON ur.role_id = r.id
ORDER BY p.created_at DESC;

-- 7. Verificar functions existentes
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('handle_new_user', 'custom_access_token_hook', 'get_user_permissions', 'user_has_permission');

-- 8. Verificar triggers existentes
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'public'
ORDER BY c.relname, t.tgname;

-- 9. Verificar policies RLS
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
ORDER BY tablename, policyname;

-- 10. Verificar se o JWT hook está configurado
SELECT 
    name,
    hook_table_id,
    hook_name,
    created_at
FROM supabase_functions.hooks
WHERE hook_name = 'custom_access_token_hook';