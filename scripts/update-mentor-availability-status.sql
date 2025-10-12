-- Script para ajustar availability_status dos mentores
-- Execute este script no Supabase SQL Editor

-- Primeiro, vamos ver o status atual dos mentores
SELECT 
  id, 
  full_name, 
  current_position, 
  availability_status,
  (availability_status = 'available') as is_available
FROM mentors_view 
ORDER BY full_name;

-- Opção 1: Definir alguns mentores como disponíveis e outros ocupados
-- Substitua os IDs pelos IDs reais dos mentores que você quer disponibilizar

-- Marcar mentores específicos como disponíveis
UPDATE profiles 
SET availability_status = 'available'
WHERE id IN (
  -- Substitua pelos IDs reais dos mentores
  'mentor-id-1',
  'mentor-id-2'
) AND EXISTS (
  SELECT 1 FROM user_roles ur 
  JOIN roles r ON ur.role_id = r.id 
  WHERE ur.user_id = profiles.id AND r.name = 'mentor'
);

-- Marcar outros mentores como ocupados
UPDATE profiles 
SET availability_status = 'busy'
WHERE id IN (
  -- Substitua pelos IDs reais dos mentores
  'mentor-id-3',
  'mentor-id-4'
) AND EXISTS (
  SELECT 1 FROM user_roles ur 
  JOIN roles r ON ur.role_id = r.id 
  WHERE ur.user_id = profiles.id AND r.name = 'mentor'
);

-- Opção 2: Distribuição aleatória (50% disponível, 50% ocupado)
-- Descomente as linhas abaixo se quiser uma distribuição aleatória

/*
WITH mentor_ids AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY RANDOM()) as rn
  FROM mentors_view
)
UPDATE profiles 
SET availability_status = CASE 
  WHEN mentor_ids.rn % 2 = 0 THEN 'available'
  ELSE 'busy'
END
FROM mentor_ids
WHERE profiles.id = mentor_ids.id;
*/

-- Opção 3: Marcar todos como ocupados (agenda lotada)
-- UPDATE profiles 
-- SET availability_status = 'busy'
-- WHERE EXISTS (
--   SELECT 1 FROM user_roles ur 
--   JOIN roles r ON ur.role_id = r.id 
--   WHERE ur.user_id = profiles.id AND r.name = 'mentor'
-- );

-- Opção 4: Marcar todos como disponíveis
-- UPDATE profiles 
-- SET availability_status = 'available'
-- WHERE EXISTS (
--   SELECT 1 FROM user_roles ur 
--   JOIN roles r ON ur.role_id = r.id 
--   WHERE ur.user_id = profiles.id AND r.name = 'mentor'
-- );

-- Verificar o resultado final
SELECT 
  full_name, 
  current_position,
  availability_status,
  (availability_status = 'available') as is_available,
  expertise_areas,
  mentorship_topics
FROM mentors_view 
ORDER BY availability_status, full_name;