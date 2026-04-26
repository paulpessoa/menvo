-- Adiciona a coluna learning_goals para mentorados
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS learning_goals TEXT;

-- Atualiza o cache do schema (Supabase faz isso automaticamente, mas é bom para o histórico)
COMMENT ON COLUMN public.profiles.learning_goals IS 'Objetivos de aprendizado e desenvolvimento do mentorado.';
