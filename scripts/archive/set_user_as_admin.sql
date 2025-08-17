-- Script para definir um usuário como admin
-- Substitua 'user_email@example.com' pelo email do usuário que você quer tornar admin

-- Método 1: Se você souber o email do usuário
UPDATE profiles 
SET user_role = 'admin'::user_role,
    verification_status = 'verified'::verification_status,
    updated_at = NOW()
WHERE email = 'user_email@example.com';

-- Método 2: Se você souber o ID do usuário
-- UPDATE profiles 
-- SET user_role = 'admin'::user_role,
--     verification_status = 'verified'::verification_status,
--     updated_at = NOW()
-- WHERE id = 'user-uuid-here';

-- Verificar se a atualização funcionou
SELECT id, email, user_role, verification_status, created_at, updated_at
FROM profiles 
WHERE email = 'user_email@example.com';

-- Opcional: Criar entrada na tabela user_roles se estiver usando o novo schema
INSERT INTO user_roles (user_id, role_type, is_primary, status)
SELECT id, 'admin', true, 'active'
FROM profiles 
WHERE email = 'user_email@example.com'
ON CONFLICT (user_id, role_type) 
DO UPDATE SET 
  is_primary = true,
  status = 'active',
  updated_at = NOW();
