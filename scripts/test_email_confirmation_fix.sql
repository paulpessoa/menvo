-- =================================================================
-- TESTE DE CORREÇÃO DO EMAIL DE CONFIRMAÇÃO
-- Execute este script após fazer um teste de registro
-- =================================================================

-- 1. Verificar usuários criados nos últimos 10 minutos
SELECT 
    'Recent Registrations' as test_type,
    id,
    email,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    CASE 
        WHEN email_confirmed_at IS NULL THEN '❌ Não confirmado'
        ELSE '✅ Confirmado'
    END as confirmation_status,
    EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_ago
FROM auth.users 
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;

-- 2. Verificar se perfis foram criados automaticamente
SELECT 
    'Profile Creation Test' as test_type,
    u.email,
    p.role,
    p.status,
    p.verification_status,
    p.first_name,
    p.last_name,
    CASE 
        WHEN p.id IS NULL THEN '❌ Perfil não criado'
        ELSE '✅ Perfil criado'
    END as profile_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY u.created_at DESC;

-- 3. Verificar se validation requests foram criadas para mentores
SELECT 
    'Validation Request Test' as test_type,
    u.email,
    p.role,
    vr.request_type,
    vr.status,
    vr.data,
    CASE 
        WHEN p.role = 'mentor' AND vr.id IS NULL THEN '❌ Validation request não criada'
        WHEN p.role = 'mentor' AND vr.id IS NOT NULL THEN '✅ Validation request criada'
        WHEN p.role != 'mentor' THEN '➖ Não aplicável (não é mentor)'
        ELSE '❓ Status desconhecido'
    END as validation_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.validation_requests vr ON u.id = vr.user_id
WHERE u.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY u.created_at DESC;

-- 4. Verificar se user_roles foram atribuídos
SELECT 
    'User Roles Test' as test_type,
    u.email,
    p.role as profile_role,
    r.name as assigned_role,
    ur.is_primary,
    CASE 
        WHEN ur.id IS NULL THEN '❌ Role não atribuído'
        ELSE '✅ Role atribuído'
    END as role_assignment_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.roles r ON ur.role_id = r.id
WHERE u.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY u.created_at DESC;

-- 5. Resumo do teste
SELECT 
    'Test Summary' as test_type,
    COUNT(*) as total_new_users,
    COUNT(CASE WHEN u.email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users,
    COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) as users_with_profiles,
    COUNT(CASE WHEN ur.id IS NOT NULL THEN 1 END) as users_with_roles
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.created_at > NOW() - INTERVAL '10 minutes';

-- 6. Instruções para o próximo passo
SELECT 
    'Next Steps' as instruction_type,
    'Se os usuários aparecem como "Não confirmado", verifique:' as step_1,
    '1. Caixa de entrada e spam do email usado no teste' as step_2,
    '2. Configurações de SMTP no Supabase Dashboard' as step_3,
    '3. Logs do Supabase para erros de email' as step_4,
    '4. Se está usando ambiente de desenvolvimento vs produção' as step_5;