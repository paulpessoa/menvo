-- Converte o ID da tabela mentor_availability para UUID
-- Mantendo a consistência do banco

BEGIN;

-- 1. Remover a PK antiga
ALTER TABLE public.mentor_availability DROP CONSTRAINT IF EXISTS mentor_availability_pkey;

-- 2. Limpar dados de teste (Garante transição limpa)
TRUNCATE public.mentor_availability CASCADE;

-- 3. Mudar PK para UUID
ALTER TABLE public.mentor_availability ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.mentor_availability ALTER COLUMN id TYPE UUID USING (gen_random_uuid());
ALTER TABLE public.mentor_availability ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.mentor_availability ADD PRIMARY KEY (id);

COMMIT;
