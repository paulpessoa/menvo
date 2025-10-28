-- Script para testar a view de mentores após aplicar a correção

-- 1. Ver quantos mentores aparecem na view pública
SELECT COUNT(*) as mentores_publicos FROM mentors_view;

-- 2. Ver quantos mentores existem no total
SELECT COUNT(*) as total_mentores FROM mentors_admin_view;

-- 3. Ver detalhes dos mentores por status
SELECT 
  profile_status,
  COUNT(*) as quantidade
FROM mentors_admin_view
GROUP BY profile_status;

-- 4. Ver mentores com perfil incompleto
SELECT 
  id,
  full_name,
  first_name,
  last_name,
  CASE 
    WHEN first_name IS NULL OR TRIM(first_name) = '' THEN '❌ Falta nome'
    ELSE '✅ Nome OK'
  END as status_nome,
  CASE 
    WHEN last_name IS NULL OR TRIM(last_name) = '' THEN '❌ Falta sobrenome'
    ELSE '✅ Sobrenome OK'
  END as status_sobrenome,
  CASE 
    WHEN bio IS NULL OR LENGTH(TRIM(bio)) = 0 THEN '❌ Falta bio'
    ELSE '✅ Bio OK'
  END as status_bio,
  verified,
  profile_status
FROM mentors_admin_view
WHERE profile_status = 'incomplete_profile'
ORDER BY created_at DESC;

-- 5. Ver mentores prontos para verificação
SELECT 
  id,
  full_name,
  email,
  verified,
  profile_status
FROM mentors_admin_view
WHERE profile_status = 'pending_verification'
ORDER BY created_at DESC;

-- 6. Ver mentores verificados
SELECT 
  id,
  full_name,
  email,
  verified,
  profile_status
FROM mentors_admin_view
WHERE profile_status = 'verified'
ORDER BY created_at DESC;
