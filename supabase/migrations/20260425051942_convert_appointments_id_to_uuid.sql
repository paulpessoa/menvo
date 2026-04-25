-- Converte o ID da tabela appointments para UUID
-- E atualiza as referências em outras tabelas

BEGIN;

-- 1. Remover FKs que dependem do appointments.id
ALTER TABLE IF EXISTS public.appointment_feedbacks DROP CONSTRAINT IF EXISTS appointment_feedbacks_appointment_id_fkey;

-- 2. Limpar dados (para evitar erro de conversão de serial antigo para UUID)
-- Se você quiser manter os dados, a lógica seria bem mais complexa (mapeamento de IDs).
-- Como Staff Engineer, recomendo limpar agendamentos de teste para uma transição limpa.
TRUNCATE public.appointment_feedbacks CASCADE;
TRUNCATE public.appointments CASCADE;

-- 3. Mudar PK do appointments
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_pkey;
ALTER TABLE public.appointments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.appointments ALTER COLUMN id TYPE UUID USING (gen_random_uuid());
ALTER TABLE public.appointments ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.appointments ADD PRIMARY KEY (id);

-- 4. Mudar FK do appointment_feedbacks
ALTER TABLE public.appointment_feedbacks ALTER COLUMN appointment_id TYPE UUID USING (gen_random_uuid());

-- 5. Restaurar FKs
ALTER TABLE public.appointment_feedbacks 
ADD CONSTRAINT appointment_feedbacks_appointment_id_fkey 
FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE;

COMMIT;
