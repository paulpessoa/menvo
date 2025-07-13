-- =================================================================
-- MENVO - SCRIPT DE MIGRAÇÃO DE USUÁRIOS EXISTENTES
-- Este script migra usuários de auth.users para public.profiles
-- que ainda não possuem um perfil.
-- Execute APÓS o 001-initial-schema.sql e 002-seed-data.sql
-- =================================================================

BEGIN;

INSERT INTO public.profiles (
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
    -- Tenta obter first_name de raw_user_meta_data, senão usa a primeira parte do email
    COALESCE(
        NULLIF(au.raw_user_meta_data->>'first_name', ''),
        SPLIT_PART(au.email, '@', 1)
    ) AS first_name,
    -- Tenta obter last_name de raw_user_meta_data, senão usa 'User'
    COALESCE(
        NULLIF(au.raw_user_meta_data->>'last_name', ''),
        'User'
    ) AS last_name,
    -- Tenta obter full_name de raw_user_meta_data, senão concatena first_name e last_name
    COALESCE(
        NULLIF(au.raw_user_meta_data->>'full_name', ''),
        CONCAT(
            COALESCE(NULLIF(au.raw_user_meta_data->>'first_name', ''), SPLIT_PART(au.email, '@', 1)),
            ' ',
            COALESCE(NULLIF(au.raw_user_meta_data->>'last_name', ''), 'User')
        )
    ) AS full_name,
    -- Define a role baseada em user_type ou 'pending' como padrão
    CASE
        WHEN au.raw_user_meta_data->>'user_type' = 'mentor' THEN 'mentor'::public.user_role
        WHEN au.raw_user_meta_data->>'user_type' = 'mentee' THEN 'mentee'::public.user_role
        WHEN au.raw_user_meta_data->>'user_type' = 'admin' THEN 'admin'::public.user_role
        WHEN au.raw_user_meta_data->>'user_type' = 'volunteer' THEN 'volunteer'::public.user_role
        WHEN au.raw_user_meta_data->>'user_type' = 'moderator' THEN 'moderator'::public.user_role
        ELSE 'pending'::public.user_role
    END AS role,
    -- Define o status baseado na confirmação de email
    CASE
        WHEN au.email_confirmed_at IS NOT NULL THEN 'active'::public.user_status
        ELSE 'pending'::public.user_status
    END AS status,
    -- Define o status de verificação
    CASE
        WHEN au.email_confirmed_at IS NOT NULL THEN 'verified'::public.verification_status
        ELSE 'pending'::public.verification_status
    END AS verification_status,
    au.created_at,
    NOW() AS updated_at
FROM
    auth.users AS au
LEFT JOIN
    public.profiles AS p ON au.id = p.id
WHERE
    p.id IS NULL; -- Apenas insere usuários que não têm um perfil existente

COMMIT;

-- Opcional: Verifique os resultados após a execução
SELECT COUNT(*) FROM public.profiles;
SELECT id, email, full_name, role, status, verification_status FROM public.profiles LIMIT 10;
