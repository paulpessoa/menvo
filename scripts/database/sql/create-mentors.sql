-- Script SQL para criar mentores diretamente no banco
-- Execute este script no Supabase SQL Editor

-- 1. Primeiro, vamos criar os usuários na tabela auth.users (simulando o que o Supabase Auth faria)
-- Nota: Em produção, isso seria feito via Supabase Auth API

-- 2. Criar perfis dos mentores diretamente
INSERT INTO public.profiles (
  id, 
  email, 
  first_name, 
  last_name, 
  bio, 
  expertise_areas, 
  verified,
  created_at
) VALUES 
(
  gen_random_uuid(),
  'ana.silva.mentor@menvo.com',
  'Ana',
  'Silva',
  'Desenvolvedora Full Stack com 8 anos de experiência em React, Node.js e Python. Especialista em arquitetura de sistemas e mentoria técnica.',
  ARRAY['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'MongoDB'],
  true,
  NOW()
),
(
  gen_random_uuid(),
  'carlos.santos.mentor@menvo.com',
  'Carlos',
  'Santos',
  'Tech Lead e Arquiteto de Software com foco em microserviços e DevOps. 10+ anos ajudando desenvolvedores a crescer na carreira.',
  ARRAY['Java', 'Spring Boot', 'Kubernetes', 'Docker', 'Microservices', 'DevOps'],
  true,
  NOW()
),
(
  gen_random_uuid(),
  'mariana.costa.mentor@menvo.com',
  'Mariana',
  'Costa',
  'Product Manager e UX Designer com background técnico. Especialista em transformação digital e gestão de produtos tech.',
  ARRAY['Product Management', 'UX/UI Design', 'Agile', 'Scrum', 'Data Analysis', 'Figma'],
  true,
  NOW()
),
(
  gen_random_uuid(),
  'roberto.oliveira.mentor@menvo.com',
  'Roberto',
  'Oliveira',
  'Engenheiro de Dados e Machine Learning Engineer. Focado em Big Data, AI e ajudando profissionais a entrar na área de dados.',
  ARRAY['Python', 'Machine Learning', 'Data Science', 'SQL', 'Apache Spark', 'TensorFlow'],
  true,
  NOW()
);

-- 3. Atribuir role de mentor aos usuários criados
INSERT INTO public.user_roles (user_id, role_id)
SELECT 
  p.id,
  r.id
FROM public.profiles p
CROSS JOIN public.roles r
WHERE p.email IN (
  'ana.silva.mentor@menvo.com',
  'carlos.santos.mentor@menvo.com', 
  'mariana.costa.mentor@menvo.com',
  'roberto.oliveira.mentor@menvo.com'
)
AND r.name = 'mentor'
AND p.created_at > NOW() - INTERVAL '1 minute'; -- Apenas os recém-criados

-- 4. Verificar os mentores criados
SELECT 
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
ORDER BY p.created_at DESC;
