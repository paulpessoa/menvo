-- Remove a tabela de tipos de atividades se existir
DROP TABLE IF EXISTS public.volunteer_activity_types CASCADE;

-- Simplifica a tabela volunteer_activities
ALTER TABLE public.volunteer_activities 
DROP COLUMN IF EXISTS activity_type_id,
DROP COLUMN IF EXISTS location,
DROP COLUMN IF EXISTS organization,
DROP COLUMN IF EXISTS evidence_url;

-- Adiciona coluna activity_type como string simples se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'volunteer_activities' 
                   AND column_name = 'activity_type') THEN
        ALTER TABLE public.volunteer_activities 
        ADD COLUMN activity_type TEXT NOT NULL DEFAULT 'Atividade Geral';
    END IF;
END $$;

-- Garante que a estrutura está correta
ALTER TABLE public.volunteer_activities 
ALTER COLUMN activity_type SET NOT NULL;

-- Cria índice para performance
CREATE INDEX IF NOT EXISTS idx_volunteer_activities_activity_type 
ON public.volunteer_activities(activity_type);

-- Atualiza registros existentes se necessário
UPDATE public.volunteer_activities 
SET activity_type = 'Atividade Geral' 
WHERE activity_type IS NULL OR activity_type = '';

-- Verifica a estrutura final
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'volunteer_activities' 
ORDER BY ordinal_position;
