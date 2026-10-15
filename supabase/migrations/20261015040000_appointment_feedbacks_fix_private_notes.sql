-- appointment_feedbacks_fix_private_notes: restringe acesso direto à tabela
-- appointment_feedbacks apenas aos participantes (reviewer e reviewed) e admins,
-- eliminando o vazamento de private_notes e admin_notes para terceiros.
-- As avaliações aprovadas passam a ser lidas publicamente via appointment_feedbacks_public.

-- 1. Remove a policy permissiva que expunha todas as linhas para authenticated
drop policy if exists "Users can view feedbacks" on public.appointment_feedbacks;

-- 2. Garante policy de leitura para participantes (caso ainda não exista)
-- Nota: users_can_view_own_feedbacks já cobre ((auth.uid() = reviewer_id) OR (auth.uid() = reviewed_id))
-- e Admins can manage all feedbacks cobre administradores.

-- 3. View pública contendo apenas colunas seguras de feedbacks aprovados
create or replace view public.appointment_feedbacks_public
with (security_invoker = false)
as
  select
    id,
    appointment_id,
    reviewer_id,
    reviewed_id,
    rating,
    public_feedback,
    created_at
  from public.appointment_feedbacks
  where status = 'approved';

-- 4. Permissões de leitura para anon e authenticated na view pública
grant select on public.appointment_feedbacks_public to anon, authenticated;
