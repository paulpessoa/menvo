-- Adicionar mentores de exemplo
-- Primeiro, criar perfis dos mentores

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

-- Atribuir role de mentor aos usuários criados
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
AND p.created_at > NOW() - INTERVAL '5 minutes'; -- Apenas os recém-criados

-- Configurar paulmspessoa@gmail.com como admin se existir
DO $$
DECLARE
    admin_user_id UUID;
    admin_role_id INTEGER;
BEGIN
    -- Buscar o usuário admin
    SELECT id INTO admin_user_id 
    FROM public.profiles 
    WHERE email = 'paulmspessoa@gmail.com';
    
    -- Buscar o ID da role admin
    SELECT id INTO admin_role_id 
    FROM public.roles 
    WHERE name = 'admin';
    
    -- Se ambos existem, atribuir a role
    IF admin_user_id IS NOT NULL AND admin_role_id IS NOT NULL THEN
        -- Remover roles existentes
        DELETE FROM public.user_roles WHERE user_id = admin_user_id;
        
        -- Adicionar role admin
        INSERT INTO public.user_roles (user_id, role_id) 
        VALUES (admin_user_id, admin_role_id);
        
        RAISE NOTICE 'Admin role atribuída para paulmspessoa@gmail.com';
    ELSE
        RAISE NOTICE 'Usuário admin ou role não encontrados';
    END IF;
END $$;
