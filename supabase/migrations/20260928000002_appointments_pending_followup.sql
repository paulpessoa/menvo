-- C-T2: marca o lembrete único enviado ao mentor para pedidos pendentes.
-- Não reutiliza reminded_at porque essa coluna controla o lembrete do dia
-- da sessão (só para confirmed); reutilizar faria o lembrete do dia sumir.
alter table public.appointments
  add column if not exists pending_reminder_sent_at timestamptz;

create index if not exists appointments_pending_followup_idx
  on public.appointments (status, scheduled_at)
  where status = 'pending';
