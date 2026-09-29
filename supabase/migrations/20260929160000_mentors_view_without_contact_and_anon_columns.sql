-- Etapa A2 da correção de exposição (docs/COMMUNITY_CONTACT_PLAN.md §2).
-- Depois de 20260929150000, anon via 13 linhas (mentores públicos), mas ainda
-- com email, phone, address e, em 4 delas, original_data.
--
-- 1. mentors_view é recriada SEM email, phone, address, origin_platform e
--    external_id. O resto da definição é a que estava no banco em 2026-09-29
--    (pg_get_viewdef), inclusive security_invoker. DROP sem CASCADE: se algum
--    objeto depender da view, a migração falha em vez de apagá-lo.
--    O painel admin, único que lia email da view, passou a buscar em profiles
--    (lib/services/admin/admin.service.ts#getAllMentors).
-- 2. Com a view sem essas colunas, anon pode perder o SELECT nelas em
--    profiles sem quebrar /mentors (security_invoker checa as colunas que a
--    view usa com o papel de quem consulta).

drop view public.mentors_view;

create view public.mentors_view
with (security_invoker = true)
as
select
  p.id, p.first_name, p.last_name, p.full_name, p.slug, p.bio, p.avatar_url,
  p.job_title, p.company, p.experience_years,
  p.linkedin_url, p.github_url, p.twitter_url, p.website_url, p.portfolio_url,
  p.city, p.state, p.country, p.timezone,
  p.academic_level, p.institution, p.course, p.expected_graduation,
  p.expertise_areas, p.mentorship_topics, p.free_topics, p.inclusive_tags, p.languages,
  p.mentorship_approach, p.what_to_expect, p.ideal_mentee, p.mentorship_guidelines,
  p.availability_status, p.verified, p.verification_status, p.is_pending_mentor,
  p.is_public, p.is_volunteer, p.chat_enabled, p.show_in_community, p.cv_url,
  p.average_rating, p.total_sessions, p.total_reviews, p.created_at, p.updated_at,
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
where exists (
  select 1
  from public.user_roles ur
  join public.roles r on ur.role_id = r.id
  where ur.user_id = p.id and r.name = 'mentor'
);

revoke all on public.mentors_view from anon, authenticated;
grant select on public.mentors_view to anon, authenticated, service_role;

-- Colunas de profiles para anon: tudo que a view usa + o que as telas
-- públicas leem direto (reviews, favoritos). Fora: email, phone, age,
-- address, original_data, verification_notes, external_id,
-- email_opt_out_at, invite_sent_at, origin_platform,
-- ai_disclosure_accepted_at e demais colunas internas.
revoke select on public.profiles from anon;
grant select (
  id, first_name, last_name, full_name, slug, bio, avatar_url,
  job_title, company, experience_years,
  linkedin_url, github_url, twitter_url, website_url, portfolio_url,
  city, state, country, location, timezone,
  academic_level, institution, course, expected_graduation, learning_goals,
  expertise_areas, mentorship_topics, free_topics, inclusive_tags, languages,
  mentorship_approach, what_to_expect, ideal_mentee, mentorship_guidelines,
  availability_status, verified, verification_status, is_pending_mentor,
  is_public, is_volunteer, chat_enabled, show_in_community, cv_url,
  average_rating, total_sessions, total_reviews, search_vector,
  created_at, updated_at
) on public.profiles to anon;

-- Verificação depois de aplicar:
--   begin; set local role anon;
--   select count(*) from public.mentors_view;           -- funciona
--   select email from public.profiles limit 1;           -- permission denied
--   select original_data from public.profiles limit 1;   -- permission denied
--   rollback;
