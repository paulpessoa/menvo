-- Fecha três funções security definer que qualquer visitante (chave pública)
-- podia chamar por /rest/v1/rpc/...:
--
--   * assign_user_role(uuid, text): dá qualquer papel, inclusive admin, a
--     qualquer usuário. Contorna a correção de user_roles
--     (20261003030000_user_roles_no_self_assign.sql), porque roda com os
--     direitos do dono e ignora a RLS;
--   * get_google_calendar_tokens(uuid): devolve access/refresh token do Google
--     de qualquer usuário;
--   * save_google_calendar_tokens(...): grava tokens para qualquer usuário.
--
-- Nenhuma é usada: o código lê/grava google_calendar_tokens pela tabela
-- (lib/google-calendar-db.ts) e atribui papel direto em user_roles com service
-- role. Só o service role continua podendo chamar. Achado pelo advisor de
-- segurança do Supabase (anon_security_definer_function_executable).
--
-- Teste primeiro trocando `commit;` por `rollback;`.

begin;

revoke execute on function public.assign_user_role(uuid, text)
  from public, anon, authenticated;
revoke execute on function public.get_google_calendar_tokens(uuid)
  from public, anon, authenticated;
revoke execute on function public.save_google_calendar_tokens(uuid, text, text, integer, text)
  from public, anon, authenticated;

grant execute on function public.assign_user_role(uuid, text) to service_role;
grant execute on function public.get_google_calendar_tokens(uuid) to service_role;
grant execute on function public.save_google_calendar_tokens(uuid, text, text, integer, text) to service_role;

do $$
declare
  abertas text;
begin
  select string_agg(p.oid::regprocedure::text, ', ')
    into abertas
    from pg_proc p
   where p.pronamespace = 'public'::regnamespace
     and p.proname in ('assign_user_role', 'get_google_calendar_tokens', 'save_google_calendar_tokens')
     and (has_function_privilege('anon', p.oid, 'execute')
          or has_function_privilege('authenticated', p.oid, 'execute'));

  if abertas is not null then
    raise exception 'Ainda executáveis por anon/authenticated: %', abertas;
  end if;
end $$;

commit;
