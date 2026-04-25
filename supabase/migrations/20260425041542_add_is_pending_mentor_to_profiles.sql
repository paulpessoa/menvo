-- Adiciona a coluna is_pending_mentor à tabela profiles se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_pending_mentor') THEN
        ALTER TABLE public.profiles ADD COLUMN is_pending_mentor BOOLEAN DEFAULT false;
    END IF;
END $$;
