-- =================================================================
-- SCRIPT PARA APLICAR CONSOLIDAÇÃO DE AUTENTICAÇÃO
-- Execute este script no Supabase SQL Editor para aplicar as mudanças
-- =================================================================

-- 1. Verificar estrutura atual da tabela profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar se há dados na tabela profiles
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'pending' THEN 1 END) as pending_users,
    COUNT(CASE WHEN role = 'mentor' THEN 1 END) as mentors,
    COUNT(CASE WHEN role = 'mentee' THEN 1 END) as mentees,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins
FROM public.profiles;

-- 3. Verificar se há inconsistências entre auth.users e profiles
SELECT 
    'Missing in profiles' as issue,
    COUNT(*) as count
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 
    'Missing in auth.users' as issue,
    COUNT(*) as count
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- 4. Verificar se o trigger de sincronização existe
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'sync_user_metadata_trigger';

-- 5. Verificar se a função JWT hook está configurada
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'custom_access_token_hook'
AND routine_schema = 'public';

-- 6. Testar a função de sincronização (se existir)
DO $
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'sync_all_user_metadata') THEN
        RAISE NOTICE 'Função sync_all_user_metadata encontrada. Execute manualmente se necessário: SELECT public.sync_all_user_metadata();';
    ELSE
        RAISE NOTICE 'Função sync_all_user_metadata não encontrada. Execute a migração primeiro.';
    END IF;
END
$;

-- 7. Verificar permissões das funções
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    p.proacl as permissions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('sync_user_metadata', 'sync_all_user_metadata', 'custom_access_token_hook');