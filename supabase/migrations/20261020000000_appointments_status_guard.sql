-- appointments: o banco passa a recusar transições de status impossíveis e
-- mudanças de quem participa da sessão.
--
-- Por quê (docs/blueprint/appointments-audit.md, tarefa 3 do hardening-plan):
-- o status era escrito em 13 lugares e só 3 conferiam o estado de origem. A
-- policy de UPDATE deixa o participante mudar QUALQUER coluna pela API do
-- Supabase, sem passar pelas rotas: o mentorado podia confirmar o próprio
-- pedido, reabrir uma sessão cancelada ou trocar o mentor_id da linha.
--
-- Regras (as mesmas de lib/domain/appointments/appointment-status.entity.ts):
--   pending   -> confirmed | cancelled
--   confirmed -> completed | cancelled
--   completed -> cancelled            (no-show registrado pelo mentor)
--   cancelled -> (nada)
-- Repetir o mesmo status não é transição e sempre passa.
--
-- Quem: em update direto do cliente (current_user authenticated/anon), só o
-- mentor confirma e só o mentor desfaz uma sessão concluída, e ninguém troca
-- mentor_id, mentee_id ou created_at. Rotas com service_role e funções
-- security definer (check-in, cron, admin) passam só pela tabela de pares:
-- elas já conferem o ator no código.
--
-- Estado no banco quando escrita (2026-10-19): 6 linhas, 3 completed e
-- 3 cancelled, nenhuma afetada (o trigger só olha updates futuros).

create or replace function public.appointments_guard_update()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_direct boolean := current_user in ('authenticated', 'anon');
  v_uid uuid := auth.uid();
begin
  if v_direct and (
       new.mentor_id is distinct from old.mentor_id
    or new.mentee_id is distinct from old.mentee_id
    or new.created_at is distinct from old.created_at
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'appointment_immutable_column';
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  if not (
       (old.status = 'pending'   and new.status in ('confirmed', 'cancelled'))
    or (old.status = 'confirmed' and new.status in ('completed', 'cancelled'))
    or (old.status = 'completed' and new.status = 'cancelled')
  ) then
    raise exception using
      errcode = 'P0001',
      message = format('appointment_invalid_transition: %s -> %s', old.status, new.status);
  end if;

  if v_direct
     and (new.status = 'confirmed' or old.status = 'completed')
     and v_uid is distinct from old.mentor_id then
    raise exception using
      errcode = 'P0001',
      message = format('appointment_transition_forbidden: %s -> %s', old.status, new.status);
  end if;

  return new;
end;
$$;

-- Não é security definer de propósito: current_user precisa ser quem chamou.
revoke all on function public.appointments_guard_update() from public, anon, authenticated;

drop trigger if exists appointments_guard_update on public.appointments;
create trigger appointments_guard_update
  before update on public.appointments
  for each row execute function public.appointments_guard_update();

-- Policies duplicadas (mesma regra com dois nomes; as de role `public` também
-- valiam para anon, onde auth.uid() é nulo e nunca casa). Fica uma de cada.
drop policy if exists "users_can_view_own_appointments" on public.appointments;
drop policy if exists "users_can_update_own_appointments" on public.appointments;
drop policy if exists "authenticated_can_create_appointments" on public.appointments;
