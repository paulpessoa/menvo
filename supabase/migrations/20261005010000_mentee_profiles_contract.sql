-- Fase 3 de docs/domains/profiles-schema.md, etapa "contract".
--
-- APLIQUE SOMENTE DEPOIS que o código que lê/grava mentee_profiles estiver em
-- produção E depois do bloco RESYNC de 20261005000000_mentee_profiles_expand.sql.
-- O código antigo ainda lê e grava estas colunas em profiles; apagá-las antes
-- do deploy derruba /api/auth/me, /api/profile, o onboarding e o upload de CV.
--
-- Apaga de profiles as 6 colunas que foram para mentee_profiles (institution,
-- course, academic_level, expected_graduation, learning_goals, cv_url), junto com:
--   * trigger/função profiles_mirror_mentee_fields (transição do expand);
--   * as colunas cv_url e expected_graduation de mentors_view (viravam null).
--     A view é recriada (drop + create: create or replace não remove coluna) e
--     refaz os grants. Sem CASCADE: se algo depender da view, o drop aborta;
--   * community_ready, coluna gerada que citava learning_goals (o Postgres
--     bloqueia o drop). Uma coluna gerada não lê outra tabela, então ela é
--     recriada sem o critério "learning_goals >= 40 caracteres". Medido em
--     2026-10-02: nenhum perfil dependia dele (12 prontos, todos por
--     mentorship_topics); a guarda abaixo aborta se a contagem mudar.
-- Os grants de anon nessas colunas caem junto com elas.
--
-- ANTES DE APLICAR: exporte as colunas (CSV) para ter rollback, ex.:
--   select id, institution, course, academic_level, expected_graduation,
--          learning_goals, cv_url
--   from public.profiles;
--
-- Teste primeiro com o arquivo de teste (termina em `rollback;`).

begin;

drop trigger if exists profiles_mirror_mentee_fields on public.profiles;
drop function if exists public.profiles_mirror_mentee_fields();

do $$
declare
  divergentes int;
  dependents text;
begin
  -- mentee_profiles precisa ter tudo o que profiles tem. Se divergir, rode o
  -- RESYNC do expand antes (o trigger de transição cobre edições até agora).
  select count(*) into divergentes
  from public.profiles p
  where (coalesce(p.institution, '') <> '' or coalesce(p.course, '') <> ''
         or coalesce(p.academic_level, '') <> '' or p.expected_graduation is not null
         or coalesce(p.learning_goals, '') <> '' or coalesce(p.cv_url, '') <> '')
    and not exists (
      select 1 from public.mentee_profiles m
      where m.user_id = p.id
        and (m.institution, m.course, m.academic_level, m.expected_graduation, m.learning_goals, m.cv_url)
            is not distinct from
            (p.institution, p.course, p.academic_level, p.expected_graduation, p.learning_goals, p.cv_url)
    );

  if divergentes > 0 then
    raise exception '% perfis com dados acadêmicos diferentes (ou ausentes) em mentee_profiles. Rode o RESYNC antes.', divergentes;
  end if;

  -- Objetos (exceto a mentors_view, recriada abaixo) que ainda dependem das colunas.
  select string_agg(distinct d.classid::regclass::text || ' ' || d.objid, ', ')
    into dependents
  from pg_depend d
  join pg_attribute a on a.attrelid = d.refobjid and a.attnum = d.refobjsubid
  where d.refobjid = 'public.profiles'::regclass
    and a.attname in ('institution', 'course', 'academic_level', 'expected_graduation',
                      'learning_goals', 'cv_url')
    and d.deptype = 'n'
    and d.classid <> 'pg_attrdef'::regclass
    and not exists (
      select 1 from pg_rewrite r
      where r.oid = d.objid and d.classid = 'pg_rewrite'::regclass
        and r.ev_class = 'public.mentors_view'::regclass
    );

  if dependents is not null then
    raise exception 'Ainda há objetos dependendo das colunas a apagar: %', dependents;
  end if;

  -- profile_cv_url cita cv_url, mas de mentee_profiles.
  select string_agg(distinct p.proname, ', ')
    into dependents
  from pg_proc p
  where p.pronamespace = 'public'::regnamespace
    and p.proname <> 'profile_cv_url'
    and p.prosrc ~ '\m(institution|course|academic_level|expected_graduation|learning_goals|cv_url)\M';

  if dependents is not null then
    raise exception 'Funções ainda citam colunas a apagar: %', dependents;
  end if;
end $$;

-- community_ready sem learning_goals ---------------------------------------

select set_config('menvo.ready_before',
                  (select count(*) from public.profiles where community_ready)::text, true);

drop index if exists public.profiles_community_ready_updated_idx;
alter table public.profiles drop column community_ready;
alter table public.profiles
  add column community_ready boolean
  generated always as (
    coalesce(is_public, false)
    and char_length(coalesce(bio, '')) >= 80
    and coalesce(array_length(mentorship_topics, 1), 0) > 0
    and char_length(coalesce(linkedin_url, '')) > 0
  ) stored;
create index profiles_community_ready_updated_idx
  on public.profiles (updated_at desc) where community_ready;

-- mentors_view sem cv_url e expected_graduation ------------------------------

drop view public.mentors_view;

create view public.mentors_view
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

revoke all on public.mentors_view from public, anon, authenticated;
grant select on public.mentors_view to anon, authenticated;
grant all on public.mentors_view to service_role;

-- Colunas --------------------------------------------------------------------

alter table public.profiles
  drop column institution,
  drop column course,
  drop column academic_level,
  drop column expected_graduation,
  drop column learning_goals,
  drop column cv_url;

do $$
declare
  colunas int;
  na_view int;
  com_papel int;
  perfis int;
  linhas int;
begin
  select count(*) into colunas
  from information_schema.columns
  where table_schema = 'public' and table_name = 'profiles';

  select count(*) into na_view from public.mentors_view;

  select count(distinct ur.user_id) into com_papel
  from public.user_roles ur join public.roles r on r.id = ur.role_id
  where r.name = 'mentor';

  select count(*) into perfis from public.profiles;
  select count(*) into linhas from public.mentee_profiles;

  if (select count(*) from public.profiles where community_ready)
       <> current_setting('menvo.ready_before')::int then
    raise exception 'community_ready mudou de % para % perfis',
      current_setting('menvo.ready_before'),
      (select count(*) from public.profiles where community_ready);
  end if;
  if colunas <> 28 then
    raise exception 'profiles ficou com % colunas, esperado 28', colunas;
  end if;
  if na_view <> com_papel then
    raise exception 'mentors_view tem % mentores, mas % têm o papel', na_view, com_papel;
  end if;
  if perfis <> 718 then
    raise exception 'profiles tem % linhas, esperado 718', perfis;
  end if;
  if linhas < 589 then
    raise exception 'mentee_profiles tem % linhas, esperado pelo menos 589', linhas;
  end if;
end $$;

commit;

-- Verificação depois de aplicar:
--   select count(*) from information_schema.columns
--   where table_schema = 'public' and table_name = 'profiles';      -- 28
--   select count(*) from public.mentors_view;                       -- 13
