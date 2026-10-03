-- Fase 3 de docs/domains/profiles-schema.md, etapa "expand".
--
-- Cria mentee_profiles (1:1 com profiles) com os 6 campos acadêmicos e o
-- currículo, e copia quem tem algum deles preenchido (589 perfis em
-- 2026-10-02, 13 deles mentores). Mentor também usa esses campos: a busca
-- filtra por academic_level e a revisão de candidato lê cv_url. Por isso a
-- linha existe para qualquer papel, não só para mentorado.
--
-- mentors_view passa a ler academic_level/institution/course daqui e deixa
-- de expor cv_url e expected_graduation (viram null; nenhuma tela de mentor
-- usa). Mesmos nomes e ordem de colunas: o código que lê a view não muda.
--
-- NÃO apaga nada de profiles. Até o deploy, o código antigo ainda grava esses
-- campos em profiles; o trigger de transição profiles_mirror_mentee_fields
-- copia para mentee_profiles só o que mudou. Ele sai no "contract".
--
-- Segurança:
--   * linhas: o próprio, admin, quem divide mentoria, mentor/admin vendo
--     perfil público (comunidade) e o público só para mentor com perfil
--     público (filtro da busca) — as mesmas regras de profiles;
--   * anon lê só academic_level, institution e course (e a policy limita a
--     mentores públicos);
--   * cv_url não tem grant de leitura para ninguém fora do service role. O
--     currículo só sai por profile_cv_url(), que libera para o próprio, admin
--     e quem divide mentoria (shares_mentorship_with). Hoje anon tem grant em
--     profiles.cv_url e mentor vê o CV de qualquer mentorado público.
--
-- Teste primeiro com o arquivo de teste (termina em `rollback;`): a guarda no
-- fim aborta se a cópia ou as contagens não baterem.

begin;

-- 1. Tabela ----------------------------------------------------------------

create table if not exists public.mentee_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  institution text,
  course text,
  academic_level text,
  expected_graduation text,
  learning_goals text,
  cv_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.mentee_profiles is
  'Dados acadêmicos e currículo (1:1 com profiles), de qualquer papel. cv_url só é lido via profile_cv_url().';

drop trigger if exists update_mentee_profiles_updated_at on public.mentee_profiles;
create trigger update_mentee_profiles_updated_at
  before update on public.mentee_profiles
  for each row execute function public.update_updated_at_column();

-- 2. RLS e grants ------------------------------------------------------------

alter table public.mentee_profiles enable row level security;

drop policy if exists "Read mentee profiles" on public.mentee_profiles;
create policy "Read mentee profiles"
  on public.mentee_profiles
  for select
  to anon, authenticated
  using (
    user_id = (select auth.uid())
    or public.is_admin()
    or public.shares_mentorship_with(user_id)
    or exists (select 1 from public.profiles p
               where p.id = mentee_profiles.user_id
                 and coalesce(p.is_public, false)
                 and (public.profile_is_mentor(p.id)
                      or public.current_user_is_mentor_or_admin()))
  );

drop policy if exists "User inserts own mentee profile" on public.mentee_profiles;
create policy "User inserts own mentee profile"
  on public.mentee_profiles
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "User updates own mentee profile" on public.mentee_profiles;
create policy "User updates own mentee profile"
  on public.mentee_profiles
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Admins manage mentee profiles" on public.mentee_profiles;
create policy "Admins manage mentee profiles"
  on public.mentee_profiles
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on public.mentee_profiles from anon, authenticated;

grant select (user_id, institution, course, academic_level)
  on public.mentee_profiles to anon;

grant select (user_id, institution, course, academic_level, expected_graduation,
              learning_goals, created_at, updated_at)
  on public.mentee_profiles to authenticated;

grant insert (user_id, institution, course, academic_level, expected_graduation,
              learning_goals, cv_url)
  on public.mentee_profiles to authenticated;

grant update (institution, course, academic_level, expected_graduation,
              learning_goals, cv_url)
  on public.mentee_profiles to authenticated;

grant delete on public.mentee_profiles to authenticated; -- só a policy de admin libera
grant all on public.mentee_profiles to service_role;

-- 3. Leitura do currículo ------------------------------------------------------

create or replace function public.profile_cv_url(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.cv_url
    from public.mentee_profiles m
   where m.user_id = p_user_id
     and (p_user_id = auth.uid()
          or public.is_admin()
          or public.shares_mentorship_with(p_user_id));
$$;

revoke execute on function public.profile_cv_url(uuid) from public, anon;
grant execute on function public.profile_cv_url(uuid) to authenticated;

-- 4. Cópia -------------------------------------------------------------------

insert into public.mentee_profiles (
  user_id, institution, course, academic_level, expected_graduation,
  learning_goals, cv_url
)
select p.id, p.institution, p.course, p.academic_level, p.expected_graduation,
       p.learning_goals, p.cv_url
from public.profiles p
where coalesce(p.institution, '') <> ''
   or coalesce(p.course, '') <> ''
   or coalesce(p.academic_level, '') <> ''
   or p.expected_graduation is not null
   or coalesce(p.learning_goals, '') <> ''
   or coalesce(p.cv_url, '') <> ''
on conflict (user_id) do nothing;

-- 5. Trigger de transição (sai no contract) ---------------------------------
-- Enquanto o código antigo grava em profiles, copia para mentee_profiles só
-- as colunas que mudaram nesse UPDATE (nunca sobrescreve com valor velho).
-- security definer: as rotas antigas gravam com o cliente do usuário.

create or replace function public.profiles_mirror_mentee_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.institution         is not distinct from old.institution
     and new.course              is not distinct from old.course
     and new.academic_level      is not distinct from old.academic_level
     and new.expected_graduation is not distinct from old.expected_graduation
     and new.learning_goals      is not distinct from old.learning_goals
     and new.cv_url              is not distinct from old.cv_url then
    return new;
  end if;

  insert into public.mentee_profiles (user_id) values (new.id)
  on conflict (user_id) do nothing;

  update public.mentee_profiles m set
    institution         = case when new.institution         is distinct from old.institution         then new.institution         else m.institution         end,
    course              = case when new.course              is distinct from old.course              then new.course              else m.course              end,
    academic_level      = case when new.academic_level      is distinct from old.academic_level      then new.academic_level      else m.academic_level      end,
    expected_graduation = case when new.expected_graduation is distinct from old.expected_graduation then new.expected_graduation else m.expected_graduation end,
    learning_goals      = case when new.learning_goals      is distinct from old.learning_goals      then new.learning_goals      else m.learning_goals      end,
    cv_url              = case when new.cv_url              is distinct from old.cv_url              then new.cv_url              else m.cv_url              end
  where m.user_id = new.id;

  return new;
end;
$$;

revoke execute on function public.profiles_mirror_mentee_fields() from public, anon, authenticated;

drop trigger if exists profiles_mirror_mentee_fields on public.profiles;
create trigger profiles_mirror_mentee_fields
  after update on public.profiles
  for each row execute function public.profiles_mirror_mentee_fields();

-- 6. mentors_view lendo de mentee_profiles -----------------------------------
-- Mesma ordem e tipos de colunas (create or replace exige). cv_url e
-- expected_graduation ficam null até o contract removê-las da view.

create or replace view public.mentors_view
with (security_invoker = true)
as
select p.id,
    p.first_name,
    p.last_name,
    p.full_name,
    p.slug,
    p.bio,
    p.avatar_url,
    p.job_title,
    p.company,
    mp.experience_years,
    p.linkedin_url,
    p.github_url,
    p.website_url,
    p.portfolio_url,
    p.city,
    p.state,
    p.country,
    p.timezone,
    me.academic_level,
    me.institution,
    me.course,
    null::text as expected_graduation,
    p.expertise_areas,
    p.mentorship_topics,
    mp.free_topics,
    mp.inclusive_tags,
    p.languages,
    mp.mentorship_approach,
    mp.what_to_expect,
    mp.ideal_mentee,
    coalesce(mp.availability_status, 'available'::text) as availability_status,
    coalesce(mp.verification_status = 'approved', false) as verified,
    mp.verification_status,
    coalesce(mp.verification_status = 'pending', false) as is_pending_mentor,
    p.is_public,
    mp.is_volunteer,
    mp.chat_enabled,
    null::text as cv_url,
    ms.average_rating,
    ms.total_sessions,
    ms.total_reviews,
    p.created_at,
    p.updated_at,
    (select jsonb_agg(jsonb_build_object('day_of_week', ma.day_of_week, 'start_time', ma.start_time,
                                         'end_time', ma.end_time, 'timezone', ma.timezone))
       from public.mentor_availability ma
      where ma.mentor_id = p.id) as availability,
    (((coalesce(p.city, ''::text) ||
        case when p.city is not null and p.state is not null then ', '::text else ''::text end)
        || coalesce(p.state, ''::text)) ||
        case when (p.city is not null or p.state is not null) and p.country is not null
             then ', '::text else ''::text end) || coalesce(p.country, ''::text) as location,
    (select array_agg(distinct skill.skill)
       from unnest(array_cat(p.expertise_areas, p.mentorship_topics)) skill(skill)
      where skill.skill is not null) as mentor_skills
from public.profiles p
  left join public.mentor_profiles mp on mp.user_id = p.id
  left join public.mentee_profiles me on me.user_id = p.id
  left join public.mentor_stats ms on ms.mentor_id = p.id
where exists (select 1
                from public.user_roles ur
                join public.roles r on ur.role_id = r.id
               where ur.user_id = p.id and r.name = 'mentor'::text);

-- 7. Guarda ------------------------------------------------------------------

do $$
declare
  esperado int;
  copiados int;
  divergentes int;
  perfis int;
  mentores_view int;
  mentores_mp int;
  niveis_view int;
begin
  select count(*) into esperado from public.profiles p
   where coalesce(p.institution, '') <> '' or coalesce(p.course, '') <> ''
      or coalesce(p.academic_level, '') <> '' or p.expected_graduation is not null
      or coalesce(p.learning_goals, '') <> '' or coalesce(p.cv_url, '') <> '';
  select count(*) into copiados from public.mentee_profiles;
  select count(*) into divergentes
    from public.mentee_profiles m join public.profiles p on p.id = m.user_id
   where (m.institution, m.course, m.academic_level, m.expected_graduation, m.learning_goals, m.cv_url)
         is distinct from
         (p.institution, p.course, p.academic_level, p.expected_graduation, p.learning_goals, p.cv_url);
  select count(*) into perfis from public.profiles;
  select count(*) into mentores_view from public.mentors_view;
  select count(*) into mentores_mp from public.mentor_profiles;
  select count(*) into niveis_view from public.mentors_view where academic_level is not null;

  if copiados <> esperado or copiados <> 589 then
    raise exception 'mentee_profiles tem % linhas, esperado % (589 no diagnóstico)', copiados, esperado;
  end if;
  if divergentes > 0 then
    raise exception '% linhas de mentee_profiles diferem de profiles', divergentes;
  end if;
  if perfis <> 718 then
    raise exception 'profiles tem % linhas, esperado 718', perfis;
  end if;
  if mentores_view <> 13 then
    raise exception 'mentors_view tem % mentores, esperado 13', mentores_view;
  end if;
  if mentores_mp <> 15 then
    raise exception 'mentor_profiles tem % linhas, esperado 15', mentores_mp;
  end if;
  if niveis_view <> 13 then
    raise exception 'mentors_view tem % mentores com academic_level, esperado 13', niveis_view;
  end if;
end $$;

commit;

-- Verificação (esperado: 589 linhas, 257 com cv_url):
--   select count(*), count(cv_url) from public.mentee_profiles;
--
-- RESYNC (rode logo depois do deploy): o trigger de transição já espelha as
-- edições feitas em profiles; isto cobre qualquer divergência que tenha
-- sobrado entre o expand e o deploy.
--   insert into public.mentee_profiles (user_id, institution, course, academic_level,
--                                       expected_graduation, learning_goals, cv_url)
--   select p.id, p.institution, p.course, p.academic_level, p.expected_graduation,
--          p.learning_goals, p.cv_url
--   from public.profiles p
--   where (coalesce(p.institution, '') <> '' or coalesce(p.course, '') <> ''
--          or coalesce(p.academic_level, '') <> '' or p.expected_graduation is not null
--          or coalesce(p.learning_goals, '') <> '' or coalesce(p.cv_url, '') <> '')
--     and not exists (select 1 from public.mentee_profiles m where m.user_id = p.id)
--   on conflict (user_id) do nothing;
