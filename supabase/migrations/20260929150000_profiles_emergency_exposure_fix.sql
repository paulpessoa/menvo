-- EMERGÊNCIA: o diagnóstico de 2026-09-29 (supabase/diagnostics/
-- 20260929_profiles_exposure.sql, bloco 6) mostrou que o papel `anon` lia as
-- 578 linhas de public.profiles, com 578 e-mails, 6 telefones e 564
-- `original_data` (respostas do formulário do Estágio Recife).
-- Ver docs/COMMUNITY_CONTACT_PLAN.md §2.
--
-- As policies antigas de profiles só existem no banco (as migrações
-- *_remote_baseline são marcadores vazios). Por isso esta migração NÃO
-- remove nem reescreve policies: usa policies RESTRICTIVE, que o Postgres
-- combina com AND com todas as permissivas existentes, sejam quais forem.
--
-- Não mexe em colunas para `authenticated`: várias rotas leem o próprio
-- perfil com select('*') pelo cliente do usuário (etapa B do §2).

-- 0. Trava: se mentors_view for security_invoker, restringir colunas de
--    profiles para anon pode quebrar o diretório público. Nesse caso, parar.
do $$
declare
  opts text[];
begin
  select c.reloptions into opts
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'mentors_view';

  if opts is not null and exists (
    select 1 from unnest(opts) o
    where lower(o) in ('security_invoker=true', 'security_invoker=on', 'security_invoker=1')
  ) then
    raise exception 'mentors_view é security_invoker: revisar esta migração antes de aplicar (ver §2 do plano)';
  end if;
end $$;

-- 1. Helpers SECURITY DEFINER: as policies abaixo consultam user_roles,
--    appointments e diagnostic_shares sem depender da RLS dessas tabelas
--    (anon não lê user_roles) e sem risco de recursão entre policies.
create or replace function public.profile_is_mentor(p_profile_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = p_profile_id and r.name = 'mentor'
  );
$$;

create or replace function public.current_user_is_mentor_or_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid() and r.name in ('mentor', 'admin')
  );
$$;

create or replace function public.shares_mentorship_with(p_profile_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.appointments a
    where (a.mentor_id = auth.uid() and a.mentee_id = p_profile_id)
       or (a.mentee_id = auth.uid() and a.mentor_id = p_profile_id)
  ) or exists (
    select 1 from public.diagnostic_shares d
    where (d.mentor_id = auth.uid() and d.mentee_id = p_profile_id)
       or (d.mentee_id = auth.uid() and d.mentor_id = p_profile_id)
  );
$$;

-- Admin ativo de uma organização vê os membros dela (/dashboard/org lê
-- organization_members -> profiles(id, full_name, email) com o cliente do usuário).
create or replace function public.is_admin_of_orgs_member(p_profile_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members m
    where m.user_id = p_profile_id
      and public.is_org_admin(m.organization_id)
  );
$$;

revoke all on function public.profile_is_mentor(uuid) from public;
revoke all on function public.current_user_is_mentor_or_admin() from public;
revoke all on function public.shares_mentorship_with(uuid) from public;
revoke all on function public.is_admin_of_orgs_member(uuid) from public;
grant execute on function public.profile_is_mentor(uuid) to anon, authenticated;
grant execute on function public.current_user_is_mentor_or_admin() to authenticated;
grant execute on function public.shares_mentorship_with(uuid) to authenticated;
grant execute on function public.is_admin_of_orgs_member(uuid) to authenticated;

-- 2. Linhas: anon só vê mentores com perfil público.
drop policy if exists "Anon sees only public mentors (restrictive)" on public.profiles;
create policy "Anon sees only public mentors (restrictive)"
  on public.profiles
  as restrictive
  for select
  to anon
  using (coalesce(is_public, false) and public.profile_is_mentor(id));

-- 3. Linhas: usuário logado vê o próprio perfil; mentores públicos; perfis
--    públicos se for mentor/admin (Mural de Mentorados); qualquer perfil se
--    for admin; quem divide um agendamento ou diagnóstico com ele (os
--    embeds profiles!mentor_id/mentee_id dependem disso); e membros das
--    organizações que ele administra.
--    É a intenção de 20260928000004_community_rls, agora garantida mesmo se
--    existir uma policy permissiva antiga liberando tudo.
drop policy if exists "Authenticated profile visibility (restrictive)" on public.profiles;
create policy "Authenticated profile visibility (restrictive)"
  on public.profiles
  as restrictive
  for select
  to authenticated
  using (
    id = auth.uid()
    or public.is_admin()
    or (coalesce(is_public, false) and public.profile_is_mentor(id))
    or (coalesce(is_public, false) and public.current_user_is_mentor_or_admin())
    or public.shares_mentorship_with(id)
    or public.is_admin_of_orgs_member(id)
  );

-- 4. Colunas para anon em profiles: nada de email, phone, age, address,
--    original_data, verification_notes, external_id, email_opt_out_at,
--    invite_sent_at, origin_platform, ai_disclosure_accepted_at.
revoke select on public.profiles from anon;
grant select (
  id, slug, first_name, last_name, full_name, avatar_url, bio, job_title, company,
  city, state, country, location, timezone, languages, expertise_areas,
  mentorship_topics, free_topics, inclusive_tags, experience_years,
  linkedin_url, github_url, twitter_url, website_url, portfolio_url, cv_url,
  mentorship_approach, mentorship_guidelines, what_to_expect, ideal_mentee,
  institution, course, academic_level, expected_graduation, learning_goals,
  average_rating, total_reviews, total_sessions, availability_status,
  verified, verification_status, is_public, is_volunteer, chat_enabled,
  search_vector, created_at, updated_at
) on public.profiles to anon;

-- 5. Colunas para anon em mentors_view (a view também expunha email, phone,
--    address, external_id e origin_platform de todos os mentores).
revoke select on public.mentors_view from anon;
grant select (
  id, slug, first_name, last_name, full_name, avatar_url, bio, job_title, company,
  city, state, country, location, timezone, languages, expertise_areas,
  mentor_skills, mentorship_topics, free_topics, inclusive_tags, experience_years,
  academic_level, institution, course, expected_graduation,
  linkedin_url, github_url, twitter_url, website_url, portfolio_url, cv_url,
  mentorship_approach, mentorship_guidelines, what_to_expect, ideal_mentee,
  availability, availability_status, average_rating, total_reviews, total_sessions,
  chat_enabled, is_public, is_volunteer, is_pending_mentor, show_in_community,
  verified, verification_status, created_at, updated_at
) on public.mentors_view to anon;

-- Verificação depois de aplicar (deve retornar só mentores públicos e zero
-- e-mails; o select de email deve falhar com "permission denied"):
--   begin; set local role anon;
--   select count(*) from public.profiles;
--   select email from public.profiles limit 1;  -- erro esperado
--   rollback;
