-- Script para criar usuários de teste
-- Execute no Supabase SQL Editor

-- 1. Criar usuário MENTOR
-- Email: mentor@menvo.com.br
-- Senha: @Citroen.123
-- Role: mentor

INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
)
VALUES (
  gen_random_uuid(),
  'mentor@menvo.com.br',
  crypt('@Citroen.123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Mentor","last_name":"Teste"}',
  false,
  'authenticated'
)
ON CONFLICT (email) DO NOTHING
RETURNING id;

-- Pegar o ID do mentor criado e usar nas próximas queries
-- Substitua 'MENTOR_USER_ID' pelo UUID retornado acima

-- 2. Criar profile do mentor
INSERT INTO public.profiles (
  id,
  first_name,
  last_name,
  email,
  verified,
  created_at,
  updated_at
)
VALUES (
  'MENTOR_USER_ID',
  'Mentor',
  'Teste',
  'mentor@menvo.com.br',
  true,
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- 3. Atribuir role de mentor
INSERT INTO public.user_roles (user_id, role_id)
SELECT 'MENTOR_USER_ID', id FROM public.roles WHERE name = 'mentor'
ON CONFLICT DO NOTHING;

-- 4. Criar usuário MENTEE
-- Email: mentee@menvo.com.br
-- Senha: @Citroen.123
-- Role: mentee

INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
)
VALUES (
  gen_random_uuid(),
  'mentee@menvo.com.br',
  crypt('@Citroen.123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Mentee","last_name":"Teste"}',
  false,
  'authenticated'
)
ON CONFLICT (email) DO NOTHING
RETURNING id;

-- Pegar o ID do mentee criado
-- Substitua 'MENTEE_USER_ID' pelo UUID retornado acima

-- 5. Criar profile do mentee
INSERT INTO public.profiles (
  id,
  first_name,
  last_name,
  email,
  verified,
  created_at,
  updated_at
)
VALUES (
  'MENTEE_USER_ID',
  'Mentee',
  'Teste',
  'mentee@menvo.com.br',
  true,
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- 6. Atribuir role de mentee
INSERT INTO public.user_roles (user_id, role_id)
SELECT 'MENTEE_USER_ID', id FROM public.roles WHERE name = 'mentee'
ON CONFLICT DO NOTHING;

-- VERIFICAÇÃO
-- Execute para confirmar que os usuários foram criados:

SELECT 
  u.email,
  p.first_name,
  p.last_name,
  r.name as role
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
JOIN public.user_roles ur ON u.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
WHERE u.email IN ('mentor@menvo.com.br', 'mentee@menvo.com.br');

-- Made with Bob
