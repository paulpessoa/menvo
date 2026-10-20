-- mentors_view passa a ler as estatísticas de mentor_public_stats.
--
-- Por quê: mentors_view juntava mentor_stats, que é security_invoker e soma só
-- as linhas de appointments/appointment_feedbacks que o RLS deixa quem consulta
-- ver. Visitantes (e qualquer pessoa que não participou das sessões) viam todo
-- mentor com 0 sessões e 0 avaliações em /mentors e no perfil público. É o
-- mesmo bug do certificado, corrigido em 20261015030000_mentor_public_stats.sql
-- (tarefa 2 de docs/blueprint/hardening-plan.md).
--
-- Como: left join lateral na função security definer, que devolve só
-- agregados e só para mentor aprovado e público. Para mentor fora do catálogo a
-- função não devolve linha e a view cai no mentor_stats de antes, então o
-- próprio mentor e o admin continuam vendo os mesmos números de hoje.
--
-- Mesmas colunas, nomes, tipos e ordem: `create or replace` mantém grants e
-- quem depende da view. Única diferença visível: a média vem arredondada em 1
-- casa (4.67 -> 4.70), e a UI já mostra com toFixed(1).

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
    (case when ps.total_sessions is null then ms.average_rating
          else coalesce(ps.average_rating, 0) end)::numeric(3, 2) as average_rating,
    coalesce(ps.total_sessions, ms.total_sessions)::int as total_sessions,
    coalesce(ps.total_reviews, ms.total_reviews)::int as total_reviews,
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
  left join lateral public.mentor_public_stats(p.id) ps on true
where exists (select 1
                from public.user_roles ur
                join public.roles r on ur.role_id = r.id
               where ur.user_id = p.id and r.name = 'mentor'::text);
