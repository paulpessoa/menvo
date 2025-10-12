-- Script para listar mentores e facilitar a configuração de disponibilidade
-- Execute este primeiro para ver todos os mentores disponíveis

-- 1. Listar todos os mentores com informações relevantes
SELECT 
  id,
  full_name,
  current_position,
  current_company,
  availability_status,
  (availability_status = 'available') as is_available,
  expertise_areas,
  mentorship_topics,
  rating,
  reviews,
  sessions
FROM mentors_view 
ORDER BY full_name;

-- 2. Contar mentores por status
SELECT 
  availability_status,
  COUNT(*) as total_mentores
FROM mentors_view 
GROUP BY availability_status;

-- 3. Exemplo de como atualizar mentores específicos
-- Copie os IDs da consulta acima e use nos comandos abaixo:

/*
-- Exemplo: Marcar mentores específicos como disponíveis
UPDATE profiles 
SET availability_status = 'available'
WHERE id IN (
  'cole-aqui-o-id-do-mentor-1',
  'cole-aqui-o-id-do-mentor-2',
  'cole-aqui-o-id-do-mentor-3'
) AND EXISTS (
  SELECT 1 FROM user_roles ur 
  JOIN roles r ON ur.role_id = r.id 
  WHERE ur.user_id = profiles.id AND r.name = 'mentor'
);

-- Exemplo: Marcar outros mentores como ocupados
UPDATE profiles 
SET availability_status = 'busy'
WHERE id IN (
  'cole-aqui-o-id-do-mentor-4',
  'cole-aqui-o-id-do-mentor-5'
) AND EXISTS (
  SELECT 1 FROM user_roles ur 
  JOIN roles r ON ur.role_id = r.id 
  WHERE ur.user_id = profiles.id AND r.name = 'mentor'
);
*/