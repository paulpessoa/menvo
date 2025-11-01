-- Separar comentários do mentee e anotações do mentor
-- Renomear 'notes' para 'comments' (comentários do mentee)
-- Adicionar 'mentor_notes' (anotações do mentor)

-- 1. Adicionar nova coluna para anotações do mentor
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS mentor_notes TEXT;

-- 2. Renomear 'notes' para 'comments' (comentários do mentee)
ALTER TABLE public.appointments 
RENAME COLUMN notes TO comments;

-- 3. Migrar dados existentes que usavam o separador |||
-- Separar comentários e anotações que estavam juntos
UPDATE public.appointments
SET 
  comments = SPLIT_PART(comments, '|||', 1),
  mentor_notes = NULLIF(TRIM(SPLIT_PART(comments, '|||', 2)), '')
WHERE comments LIKE '%|||%';

-- 4. Adicionar comentários
COMMENT ON COLUMN public.appointments.comments IS 'Comentários/mensagem do mentee ao solicitar a mentoria';
COMMENT ON COLUMN public.appointments.mentor_notes IS 'Anotações do mentor ao confirmar a mentoria';
