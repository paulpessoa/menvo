-- =================================================================
-- DIAGNÓSTICO DE EMAIL DE CONFIRMAÇÃO
-- Este script verifica as configurações relacionadas ao envio de emails
-- =================================================================

-- 1. Verificar configurações de autenticação
SELECT 
    'Auth Settings Check' as check_type,
    'Verificando se email confirmation está habilitado' as description;

-- 2. Verificar usuários recentes e status de confirmação
SELECT 
    'Recent Users' as check_type,
    id,
    email,
    email_confirmed_at,
    created_at,
    CASE 
        WHEN email_confirmed_at IS NULL THEN 'Não confirmado'
        ELSE 'Confirmado'
    END as status
FROM auth.users 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verificar se há perfis criados para usuários não confirmados
SELECT 
    'Profile Creation Check' as check_type,
    u.id,
    u.email,
    u.email_confirmed_at,
    p.role,
    p.status,
    p.verification_status,
    u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.created_at > NOW() - INTERVAL '24 hours'
ORDER BY u.created_at DESC
LIMIT 10;

-- 4. Verificar se o trigger handle_new_user está funcionando
SELECT 
    'Trigger Check' as check_type,
    'Verificando se trigger handle_new_user existe' as description,
    COUNT(*) as trigger_count
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' 
AND c.relname = 'users'
AND t.tgname = 'on_auth_user_created';

-- 5. Verificar função handle_new_user
SELECT 
    'Function Check' as check_type,
    'Verificando se função handle_new_user existe' as description,
    COUNT(*) as function_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'handle_new_user';

-- 6. Verificar logs de erro (se disponível)
SELECT 
    'Error Check' as check_type,
    'Verificando se há erros recentes relacionados a email' as description;

-- 7. Testar criação de usuário de teste (comentado por segurança)
/*
-- ATENÇÃO: Descomente apenas para teste, e delete o usuário depois
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'teste@example.com',
    crypt('123456', gen_salt('bf')),
    NULL, -- Não confirmado
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Teste", "last_name": "User", "user_type": "mentee"}',
    NOW(),
    NOW(),
    encode(gen_random_bytes(32), 'base64'),
    '',
    '',
    ''
);
*/

-- 8. Verificar configurações de email template (se disponível)
SELECT 
    'Email Template Check' as check_type,
    'Verificando se templates de email estão configurados' as description;

-- Resumo final
SELECT 
    'Summary' as check_type,
    'Diagnóstico completo - verifique os resultados acima' as description,
    NOW() as checked_at;