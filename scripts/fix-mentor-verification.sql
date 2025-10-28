-- Script para corrigir a exibição de mentores não verificados
-- Execute este script no Supabase SQL Editor

-- 1. Verificar o estado atual dos mentores
SELECT 
  id,
  full_name,
  first_name,
  last_name,
  verified,
  verified_at,
  CASE 
    WHEN first_name IS NULL THEN '❌ Falta nome'
    WHEN last_name IS NULL THEN '❌ Falta sobrenome'
    WHEN bio IS NULL OR LENGTH(TRIM(bio)) = 0 THEN '❌ Falta bio'
    WHEN verified = false THEN '⏳ Não verificado'
    WHEN verified_at IS NULL THEN '⚠️ Verificado mas sem timestamp'
    ELSE '✅ OK'
  END as status
FROM profiles p
JOIN user_roles ur ON p.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'mentor'
ORDER BY created_at DESC;

-- 2. Aplicar a correção da view (copie o conteúdo da migration)
-- Ou execute: npx supabase db push

-- 3. Após aplicar a migration, verificar quantos mentores aparecem na view pública
SELECT COUNT(*) as mentores_publicos FROM mentors_view;

-- 4. Verificar quantos mentores aparecem na view admin
SELECT COUNT(*) as total_mentores FROM mentors_admin_view;

-- 5. Ver detalhes dos mentores por status
SELECT 
  profile_status,
  COUNT(*) as quantidade
FROM mentors_admin_view
GROUP BY profile_status;

-- 6. Se você quiser verificar manualmente um mentor específico (após ele completar o perfil):
-- UPDATE profiles
-- SET 
--   verified = true,
--   verified_at = NOW(),
--   updated_at = NOW()
-- WHERE id = 'COLE_O_ID_DO_MENTOR_AQUI';

-- 7. Para remover a verificação de um mentor:
-- UPDATE profiles
-- SET 
--   verified = false,
--   verified_at = NULL,
--   updated_at = NOW()
-- WHERE id = 'COLE_O_ID_DO_MENTOR_AQUI';
