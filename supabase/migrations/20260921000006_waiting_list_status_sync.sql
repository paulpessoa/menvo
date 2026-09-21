-- Lista de espera: esconder quem já entrou na plataforma.
--
-- Diagnóstico (2026-09-21): das 44 entradas, TODAS já tinham linha em
-- `profiles` — ~13 pessoas se cadastraram com Google no mesmo dia em que
-- entraram na lista, e as outras ~28 foram convidadas pelo admin via
-- `generateLink({type:'invite'})`, que cria o auth.user (e o profile pela
-- trigger) antes mesmo de a pessoa clicar. Então "tem profile" não
-- distingue quem aceitou de quem só foi convidado. O sinal certo é
-- `auth.users.last_sign_in_at`: só é preenchido quando a pessoa realmente
-- entrou (Google/LinkedIn, ou clicando no link de convite).
--
-- Dois bugs que impediam o status 'invited' de ser gravado pela rota
-- /api/admin/waiting-list/create-account: o CHECK não incluía 'invited',
-- e não havia policy de UPDATE (o RLS bloqueava silenciosamente).

alter table public.waiting_list
  drop constraint if exists waiting_list_status_check;
alter table public.waiting_list
  add constraint waiting_list_status_check
  check (status in ('pending', 'invited', 'registered', 'approved', 'rejected'));

drop policy if exists "Admins can update waiting list" on public.waiting_list;
create policy "Admins can update waiting list"
  on public.waiting_list for update
  using (public.is_admin())
  with check (public.is_admin());

-- Reconcilia o status com o que aconteceu de fato em auth.users. Chamada
-- pela listagem admin antes de ler, para que a lista reflita o estado real
-- mesmo para quem entrou pelo Google sem passar pela rota de convite.
-- SECURITY DEFINER porque auth.users não é legível pela role authenticated;
-- a checagem is_admin() dentro da função é o que impede abuso.
create or replace function public.sync_waiting_list_status()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'sync_waiting_list_status: admin only';
  end if;

  -- Entrou pelo menos uma vez => aceitou, sai da lista.
  update public.waiting_list w
     set status = 'registered', updated_at = now()
    from auth.users u
   where lower(u.email) = lower(w.email)
     and u.last_sign_in_at is not null
     and w.status <> 'registered';

  -- Convidado pelo admin mas ainda não entrou.
  update public.waiting_list w
     set status = 'invited', updated_at = now()
    from auth.users u
   where lower(u.email) = lower(w.email)
     and u.last_sign_in_at is null
     and u.invited_at is not null
     and w.status = 'pending';
end;
$$;

revoke all on function public.sync_waiting_list_status() from public;
grant execute on function public.sync_waiting_list_status() to authenticated;
