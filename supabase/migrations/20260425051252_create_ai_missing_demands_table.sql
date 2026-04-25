-- Cria a tabela para registrar demandas que a IA não conseguiu suprir
CREATE TABLE IF NOT EXISTS public.ai_missing_demands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    query_text TEXT NOT NULL,
    suggested_topics TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilita RLS (Segurança)
ALTER TABLE public.ai_missing_demands ENABLE ROW LEVEL SECURITY;

-- Permite que usuários autenticados insiram dados
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_missing_demands' 
        AND policyname = 'Allow authenticated inserts'
    ) THEN
        CREATE POLICY "Allow authenticated inserts" 
        ON public.ai_missing_demands FOR INSERT 
        TO authenticated 
        WITH CHECK (true);
    END IF;
END $$;
