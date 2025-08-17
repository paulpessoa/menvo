-- Script para migrar usuários existentes do auth.users para a tabela profiles
-- Execute este script manualmente no SQL Editor do Supabase

BEGIN;

-- Inserir usuários que existem em auth.users mas não em profiles
INSERT INTO profiles (
    id,
    email,
    first_name,
    last_name,
    full_name,
    role,
    status,
    verification_status,
    created_at,
    updated_at
)
SELECT 
    au.id,
    au.email,
    COALESCE(
        NULLIF(au.raw_user_meta_data->>'first_name', ''),
        NULLIF(au.raw_user_meta_data->>'full_name', ''),
        SPLIT_PART(au.email, '@', 1)
    ) as first_name,
    COALESCE(
        NULLIF(au.raw_user_meta_data->>'last_name', ''),
        'User'
    ) as last_name,
    COALESCE(
        NULLIF(au.raw_user_meta_data->>'full_name', ''),
        CONCAT(
            COALESCE(NULLIF(au.raw_user_meta_data->>'first_name', ''), SPLIT_PART(au.email, '@', 1)),
            ' ',
            COALESCE(NULLIF(au.raw_user_meta_data->>'last_name', ''), 'User')
        )
    ) as full_name,
    CASE 
        WHEN au.raw_user_meta_data->>'user_type' = 'mentor' THEN 'mentor'::user_role
        WHEN au.raw_user_meta_data->>'user_type' = 'mentee' THEN 'mentee'::user_role
        WHEN au.raw_user_meta_data->>'user_type' = 'volunteer' THEN 'volunteer'::user_role
        ELSE 'pending'::user_role
    END as role,
    CASE 
        WHEN au.email_confirmed_at IS NOT NULL THEN 'active'
        ELSE 'pending'
    END as status,
    CASE 
        WHEN au.email_confirmed_at IS NOT NULL THEN 'verified'::verification_status
        ELSE 'pending'::verification_status
    END as verification_status,
    au.created_at,
    NOW() as updated_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL  -- Apenas usuários que não existem em profiles
AND au.email IS NOT NULL;

-- Criar perfis de mentor para usuários que são mentores
INSERT INTO mentor_profiles (
    user_id,
    languages,
    expertise_areas,
    topics,
    inclusion_tags,
    created_at,
    updated_at
)
SELECT 
    p.id,
    ARRAY['Português'] as languages,
    ARRAY[]::TEXT[] as expertise_areas,
    ARRAY[]::TEXT[] as topics,
    ARRAY[]::TEXT[] as inclusion_tags,
    NOW() as created_at,
    NOW() as updated_at
FROM profiles p
LEFT JOIN mentor_profiles mp ON p.id = mp.user_id
WHERE p.role = 'mentor'::user_role
AND mp.user_id IS NULL;

-- Atualizar slugs para usuários que não têm
UPDATE profiles 
SET slug = LOWER(REGEXP_REPLACE(
    COALESCE(full_name, first_name || ' ' || last_name, 'user'), 
    '[^a-zA-Z0-9]+', '-', 'g'
))
WHERE slug IS NULL OR slug = '';

-- Resolver conflitos de slug adicionando números
WITH slug_conflicts AS (
    SELECT 
        id,
        slug,
        ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) as rn
    FROM profiles 
    WHERE slug IS NOT NULL
)
UPDATE profiles 
SET slug = CASE 
    WHEN sc.rn = 1 THEN sc.slug
    ELSE sc.slug || '-' || (sc.rn - 1)
END
FROM slug_conflicts sc
WHERE profiles.id = sc.id
AND sc.rn > 1;

COMMIT;

-- Verificar os resultados
SELECT 
    'Total de usuários em auth.users' as tipo,
    COUNT(*) as quantidade
FROM auth.users
UNION ALL
SELECT 
    'Total de usuários em profiles' as tipo,
    COUNT(*) as quantidade
FROM profiles
UNION ALL
SELECT 
    'Usuários com email confirmado' as tipo,
    COUNT(*) as quantidade
FROM profiles 
WHERE verification_status = 'verified'::verification_status
UNION ALL
SELECT 
    'Mentores' as tipo,
    COUNT(*) as quantidade
FROM profiles 
WHERE role = 'mentor'::user_role
UNION ALL
SELECT 
    'Mentees' as tipo,
    COUNT(*) as quantidade
FROM profiles 
WHERE role = 'mentee'::user_role;
