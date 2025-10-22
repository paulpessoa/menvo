-- Fix Appointments Policy - Simplificar para permitir criação

-- Remover policy antiga
DROP POLICY IF EXISTS "mentees_can_create_appointments" ON public.appointments;

-- Criar policy mais simples: qualquer usuário autenticado pode criar agendamento
-- onde ele é o mentee
CREATE POLICY "authenticated_can_create_appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = mentee_id
);

-- Comentário
COMMENT ON POLICY "authenticated_can_create_appointments" ON public.appointments IS 
'Permite que usuários autenticados criem agendamentos onde são o mentee';
