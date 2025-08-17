-- =================================================================
-- VERIFICAR CONFIGURAÇÕES DE EMAIL DO SUPABASE
-- Execute este script no Supabase SQL Editor para verificar as configurações
-- =================================================================

-- 1. Verificar usuários recentes e seus status
SELECT 
    'Recent Users' as check_type,
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data,
    CASE 
        WHEN email_confirmed_at IS NULL THEN '❌ Não confirmado'
        ELSE '✅ Confirmado'
    END as status
FROM auth.users 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Verificar se há configurações de SMTP customizadas
-- (Esta query pode não funcionar dependendo das permissões)
SELECT 
    'SMTP Config Check' as check_type,
    'Verifique no Dashboard: Authentication > Settings > SMTP Settings' as instruction;

-- 3. Verificar templates de email
SELECT 
    'Email Templates Check' as check_type,
    'Verifique no Dashboard: Authentication > Email Templates' as instruction,
    'Certifique-se de que "Confirm signup" está ativo e sem link tracking' as note;

-- 4. Verificar configurações de Auth
SELECT 
    'Auth Settings Check' as check_type,
    'Verifique no Dashboard: Authentication > Settings' as instruction,
    'Enable email confirmations deve estar ON' as setting_1,
    'Secure email change deve estar ON' as setting_2;

-- 5. Mostrar exemplo de como deveria ser o link
SELECT 
    'Expected Link Format' as check_type,
    'https://seudominio.com/auth/callback?code=CODIGO_AQUI&type=signup' as expected_format,
    'O link atual está passando por um serviço de tracking' as current_issue,
    'Isso quebra o PKCE flow do Supabase' as problem;