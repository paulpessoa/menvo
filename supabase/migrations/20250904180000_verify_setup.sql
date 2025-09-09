-- Verificar se tudo foi configurado corretamente

-- 1. Verificar admin
SELECT 
    'ADMIN' as tipo,
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.verified,
    r.name as role,
    p.created_at
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
LEFT JOIN public.roles r ON ur.role_id = r.id
WHERE p.email = 'paulmspessoa@gmail.com'

UNION ALL

-- 2. Verificar mentores
SELECT 
    'MENTOR' as tipo,
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.verified,
    r.name as role,
    p.created_at
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
LEFT JOIN public.roles r ON ur.role_id = r.id
WHERE p.email LIKE '%mentor@menvo.com'
ORDER BY tipo, email;
