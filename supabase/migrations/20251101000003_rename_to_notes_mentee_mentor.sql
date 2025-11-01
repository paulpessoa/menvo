-- Renomear campos para nomenclatura mais semântica
-- comments -> notes_mentee (notas/comentários do mentee)
-- mentor_notes -> notes_mentor (notas/comentários do mentor)

-- 1. Renomear 'comments' para 'notes_mentee'
ALTER TABLE public.appointments 
RENAME COLUMN comments TO notes_mentee;

-- 2. Renomear 'mentor_notes' para 'notes_mentor'
ALTER TABLE public.appointments 
RENAME COLUMN mentor_notes TO notes_mentor;

-- 3. Atualizar comentários das colunas
COMMENT ON COLUMN public.appointments.notes_mentee IS 'Comentários/mensagem do mentee ao solicitar a mentoria';
COMMENT ON COLUMN public.appointments.notes_mentor IS 'Anotações do mentor ao confirmar a mentoria';
