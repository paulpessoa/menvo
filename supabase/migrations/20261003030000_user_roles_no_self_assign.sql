-- Fecha escalada de privilégio em user_roles. Aplicada em produção em 2026-10-02.
--
-- As policies abaixo só checavam auth.uid() = user_id, não QUAL papel era
-- gravado. Com a chave pública e o próprio login, qualquer conta podia fazer
-- POST /rest/v1/user_roles {user_id: <eu>, role_id: <admin>} e virar admin
-- (is_admin() lê esta tabela) ou virar mentor sem aprovação.
--
-- O site não depende delas: toda escrita em user_roles já é feita no servidor
-- com o service role (profile/role, profile/stop-mentor, rotas admin,
-- verifications/notification.service) ou pelo trigger handle_new_user
-- (security definer). As policies de leitura e a de admin continuam.
--
-- Teste primeiro trocando `commit;` por `rollback;`.

begin;

drop policy if exists users_manage_own_roles_only on public.user_roles;
drop policy if exists users_can_insert_own_role on public.user_roles;
drop policy if exists users_can_update_own_role on public.user_roles;

do $$
declare
  restantes text;
begin
  -- Nenhuma policy de escrita pode sobrar para usuário comum: só leitura
  -- ou a de admin (is_admin()).
  select string_agg(polname, ', ') into restantes
  from pg_policy
  where polrelid = 'public.user_roles'::regclass
    and polcmd <> 'r'
    and coalesce(pg_get_expr(polqual, polrelid), '') <> 'is_admin()';

  if restantes is not null then
    raise exception 'Ainda há policies de escrita em user_roles: %', restantes;
  end if;
end $$;

commit;
