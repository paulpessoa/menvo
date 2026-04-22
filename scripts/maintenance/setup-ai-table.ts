
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function setup() {
  console.log('🏗️ Criando tabela de tracking de IA...');
  
  // Como não podemos rodar DDL arbitrário via Supabase-JS sem uma função RPC,
  // Paul, por favor, rode o SQL abaixo no seu SQL Editor do Supabase uma única vez:
  
  console.log('\n--- COPIE E COLE NO SQL EDITOR DO SUPABASE ---');
  console.log(`
CREATE TABLE IF NOT EXISTS public.ai_missing_demands (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  query_text TEXT NOT NULL,
  suggested_topics TEXT[],
  matched_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.ai_missing_demands ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view AI demands') THEN
        CREATE POLICY "Admins can view AI demands" ON public.ai_missing_demands
        FOR SELECT USING (EXISTS (
            SELECT 1 FROM public.user_roles ur 
            JOIN public.roles r ON ur.role_id = r.id 
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can log their AI queries') THEN
        CREATE POLICY "Users can log their AI queries" ON public.ai_missing_demands
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
  `);
}

setup();
