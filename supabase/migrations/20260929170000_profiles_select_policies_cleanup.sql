-- Limpeza das policies de SELECT em public.profiles (docs/COMMUNITY_CONTACT_PLAN.md §2).
--
-- Estado em produção em 2026-09-29 (pg_policies):
--   PERMISSIVE "public_view_authorized_profiles"  (public)  verified OR is_public
--      -> origem do vazamento: liberava a qualquer visitante todo perfil
--         verificado ou público.
--   PERMISSIVE "Admins can view all profiles"      (authenticated)
--      check_user_role('admin') OR own OR is_public
--   PERMISSIVE "Public profiles visibility restricted" (public)  (20260928000004)
--   RESTRICTIVE "Anon sees only public mentors (restrictive)"       (20260929150000)
--   RESTRICTIVE "Authenticated profile visibility (restrictive)"    (20260929150000)
--
-- Permissivas se combinam com OR; restritivas, com AND. Hoje o acesso
-- efetivo é "(legado) AND (nossa regra)", o que ainda bloqueia casos
-- legítimos (ex.: mentor não vê o mentorado não-público do próprio
-- agendamento). Aqui as permissivas de SELECT passam a ser exatamente a
-- nossa regra; as restritivas continuam como trava contra uma permissiva
-- nova criada por engano. Policies de INSERT/UPDATE/DELETE não mudam.

drop policy if exists "public_view_authorized_profiles" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Public profiles visibility restricted" on public.profiles;

drop policy if exists "Anon reads public mentors" on public.profiles;
create policy "Anon reads public mentors"
  on public.profiles
  for select
  to anon
  using (coalesce(is_public, false) and public.profile_is_mentor(id));

drop policy if exists "Authenticated reads allowed profiles" on public.profiles;
create policy "Authenticated reads allowed profiles"
  on public.profiles
  for select
  to authenticated
  using (
    id = (select auth.uid())
    or public.is_admin()
    or (coalesce(is_public, false) and public.profile_is_mentor(id))
    or (coalesce(is_public, false) and public.current_user_is_mentor_or_admin())
    or public.shares_mentorship_with(id)
    or public.is_admin_of_orgs_member(id)
  );

-- Verificação depois de aplicar (deve listar 2 permissivas + 2 restritivas de SELECT):
--   select policyname, permissive, roles from pg_policies
--   where schemaname = 'public' and tablename = 'profiles' and cmd = 'SELECT';
