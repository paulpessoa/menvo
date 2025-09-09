-- Script para verificar e aprovar mentores

-- 1. Listar mentores pendentes de verificação
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.verified,
  p.created_at,
  r.name as role_name
FROM public.profiles p
JOIN public.user_roles ur ON p.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
WHERE r.name = 'mentor' AND p.verified = false
ORDER BY p.created_at DESC;

-- 2. Verificar um mentor específico (substitua USER_ID_AQUI pelo ID real)
-- UPDATE public.profiles 
-- SET verified = true, updated_at = NOW()
-- WHERE id = 'USER_ID_AQUI';

-- 3. Verificar todos os mentores de uma vez (CUIDADO!)
-- UPDATE public.profiles 
-- SET verified = true, updated_at = NOW()
-- WHERE id IN (
--   SELECT p.id 
--   FROM public.profiles p
--   JOIN public.user_roles ur ON p.id = ur.user_id
--   JOIN public.roles r ON ur.role_id = r.id
--   WHERE r.name = 'mentor' AND p.verified = false
-- );

-- 4. Verificar mentores já aprovados
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.verified,
  p.created_at
FROM public.profiles p
JOIN public.user_roles ur ON p.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
WHERE r.name = 'mentor' AND p.verified = true
ORDER BY p.created_at DESC;
