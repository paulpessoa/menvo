-- Fase 0 de docs/domains/profiles-schema.md.
--
-- 1. mentor_stats: average_rating, total_reviews e total_sessions passam a ser
--    calculados de appointment_feedbacks (aprovadas) e appointments
--    (completed). As colunas de profiles eram constantes em todos os 718
--    perfis porque nada as atualizava. A view roda com os direitos do dono
--    (sem security_invoker) porque RLS esconde feedbacks e sessões de anon, e
--    só expõe agregados por mentor, nenhum dado de pessoa.
-- 2. mentors_view é recriada sem twitter_url, mentorship_guidelines e
--    show_in_community (colunas mortas) e lendo os contadores de mentor_stats.
--    DROP sem CASCADE: se algo depender da view, a migração falha.
-- 3. O grant de colunas de anon em profiles é refeito sem as colunas removidas.
-- 4. Drop das colunas mortas e dos 3 contadores, sem CASCADE. Um bloco de
--    guarda aborta a migração se alguma view, policy, índice, trigger ou
--    função ainda depender delas. Antes disso, remove o trigger
--    tr_update_mentor_stats (e sua função), que escrevia nos contadores.
--
-- ANTES DE APLICAR: exporte as colunas (CSV) para ter rollback, ex.:
--   select id, location, twitter_url, mentorship_guidelines,
--          ai_disclosure_accepted_at, mentee_status, profile_visibility,
--          show_in_community, age, address, average_rating, total_reviews,
--          total_sessions
--   from public.profiles;

begin;

create or replace view public.mentor_stats with (security_invoker = true) as
select
  p.id as mentor_id,
  coalesce(f.average_rating, 0)::numeric(3, 2) as average_rating,
  coalesce(f.total_reviews, 0)::int as total_reviews,
  coalesce(a.total_sessions, 0)::int as total_sessions
from public.profiles p
left join (
  select reviewed_id, avg(rating) as average_rating, count(*) as total_reviews
  from public.appointment_feedbacks
  where status = 'approved' and rating is not null
  group by reviewed_id
) f on f.reviewed_id = p.id
left join (
  select mentor_id, count(*) as total_sessions
  from public.appointments
  where status = 'completed'
  group by mentor_id
) a on a.mentor_id = p.id;

revoke all on public.mentor_stats from anon, authenticated;
grant select on public.mentor_stats to anon, authenticated, service_role;

drop view public.mentors_view;

create view public.mentors_view
with (security_invoker = true)
as
select
  p.id, p.first_name, p.last_name, p.full_name, p.slug, p.bio, p.avatar_url,
  p.job_title, p.company, p.experience_years,
  p.linkedin_url, p.github_url, p.website_url, p.portfolio_url,
  p.city, p.state, p.country, p.timezone,
  p.academic_level, p.institution, p.course, p.expected_graduation,
  p.expertise_areas, p.mentorship_topics, p.free_topics, p.inclusive_tags, p.languages,
  p.mentorship_approach, p.what_to_expect, p.ideal_mentee,
  p.availability_status, p.verified, p.verification_status, p.is_pending_mentor,
  p.is_public, p.is_volunteer, p.chat_enabled, p.cv_url,
  ms.average_rating, ms.total_sessions, ms.total_reviews, p.created_at, p.updated_at,
  (
    select jsonb_agg(jsonb_build_object(
      'day_of_week', ma.day_of_week,
      'start_time', ma.start_time,
      'end_time', ma.end_time,
      'timezone', ma.timezone
    ))
    from public.mentor_availability ma
    where ma.mentor_id = p.id
  ) as availability,
  (
    ((coalesce(p.city, '') ||
      case when p.city is not null and p.state is not null then ', ' else '' end) ||
      coalesce(p.state, '')) ||
    case when (p.city is not null or p.state is not null) and p.country is not null then ', ' else '' end
  ) || coalesce(p.country, '') as location,
  (
    select array_agg(distinct skill.skill)
    from unnest(array_cat(p.expertise_areas, p.mentorship_topics)) skill(skill)
    where skill.skill is not null
  ) as mentor_skills
from public.profiles p
left join public.mentor_stats ms on ms.mentor_id = p.id
where exists (
  select 1
  from public.user_roles ur
  join public.roles r on ur.role_id = r.id
  where ur.user_id = p.id and r.name = 'mentor'
);

revoke all on public.mentors_view from anon, authenticated;
grant select on public.mentors_view to anon, authenticated, service_role;

revoke select on public.profiles from anon;
grant select (
  id, first_name, last_name, full_name, slug, bio, avatar_url,
  job_title, company, experience_years,
  linkedin_url, github_url, website_url, portfolio_url,
  city, state, country, timezone,
  academic_level, institution, course, expected_graduation, learning_goals,
  expertise_areas, mentorship_topics, free_topics, inclusive_tags, languages,
  mentorship_approach, what_to_expect, ideal_mentee,
  availability_status, verified, verification_status, is_pending_mentor,
  is_public, is_volunteer, chat_enabled, cv_url,
  search_vector, created_at, updated_at
) on public.profiles to anon;

-- O trigger abaixo gravava average_rating e total_reviews em profiles a cada
-- mudança de feedback aprovada. Com as colunas apagadas ele passaria a falhar
-- em qualquer insert/update/delete de appointment_feedbacks, e mentor_stats
-- já calcula os mesmos valores ao vivo.
drop trigger tr_update_mentor_stats on public.appointment_feedbacks;
drop function public.handle_feedback_stats_update();

-- Guarda: aborta se algo ainda depender das colunas que serão apagadas.
do $$
declare
  cols text[] := array[
    'location', 'twitter_url', 'mentorship_guidelines', 'ai_disclosure_accepted_at',
    'mentee_status', 'profile_visibility', 'show_in_community', 'age', 'address',
    'average_rating', 'total_reviews', 'total_sessions'
  ];
  dependents text;
begin
  select string_agg(distinct d.classid::regclass::text || ' ' || d.objid, ', ')
    into dependents
  from pg_depend d
  join pg_attribute a on a.attrelid = d.refobjid and a.attnum = d.refobjsubid
  where d.refobjid = 'public.profiles'::regclass
    and a.attname = any (cols)
    and d.deptype = 'n'
    and d.classid <> 'pg_attrdef'::regclass
    -- CHECK da própria profiles (ex.: profiles_profile_visibility_check) some
    -- junto com a coluna, sem CASCADE.
    and not exists (
      select 1 from pg_constraint c
      where c.oid = d.objid and d.classid = 'pg_constraint'::regclass
        and c.contype = 'c' and c.conrelid = 'public.profiles'::regclass
    );

  if dependents is not null then
    raise exception 'Ainda há objetos dependendo das colunas a apagar: %', dependents;
  end if;

  select string_agg(distinct p.proname, ', ')
    into dependents
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prosrc ~* '\m(twitter_url|mentorship_guidelines|ai_disclosure_accepted_at|mentee_status|profile_visibility|show_in_community|average_rating|total_reviews|total_sessions)\M';

  if dependents is not null then
    raise exception 'Funções ainda citam colunas a apagar: %', dependents;
  end if;
end $$;

alter table public.profiles
  drop column location,
  drop column twitter_url,
  drop column mentorship_guidelines,
  drop column ai_disclosure_accepted_at,
  drop column mentee_status,
  drop column profile_visibility,
  drop column show_in_community,
  drop column age,
  drop column address,
  drop column average_rating,
  drop column total_reviews,
  drop column total_sessions;

commit;

-- Verificação depois de aplicar:
--   select mentor_id, average_rating, total_reviews, total_sessions
--   from public.mentor_stats where total_sessions > 0 limit 5;
--   begin; set local role anon;
--   select id, average_rating, total_sessions from public.mentors_view limit 3; -- funciona
--   select email from public.profiles limit 1;                                  -- permission denied
--   rollback;
