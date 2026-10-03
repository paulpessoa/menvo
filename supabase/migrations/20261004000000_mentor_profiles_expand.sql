-- Fase 2 de docs/domains/profiles-schema.md, etapa "expand".
--
-- Cria mentor_profiles (1:1 com profiles) com os 12 campos que só existem
-- para mentor, copia quem é mentor ou tem candidatura pending/rejected, e
-- recria mentors_view lendo dela, com `verified` e `is_pending_mentor`
-- calculados a partir de verification_status. Mesmos nomes e ordem de
-- colunas: o código que lê a view não muda.
--
-- Ficam em profiles (mentorados também usam): job_title, company,
-- expertise_areas, mentorship_topics, github_url, portfolio_url, website_url.
--
-- NÃO apaga nada de profiles. Até o deploy, o código antigo ainda grava os
-- campos de mentor em profiles; o trigger de transição
-- profiles_mirror_mentor_fields copia para mentor_profiles só o que mudou,
-- então a view não fica desatualizada. Ele sai no "contract".
--
-- Segurança:
--   * leitura: o próprio, admin, quem divide mentoria, e o público só para
--     mentor com perfil público (igual às policies de profiles);
--   * verification_notes não tem grant para anon/authenticated (é recado do
--     admin; hoje qualquer logado lê de mentores públicos);
--   * o usuário edita só os campos de conteúdo do próprio registro. O status
--     de verificação só muda por request_mentor_verification() /
--     withdraw_mentor_verification() (o próprio) ou pelo admin via service
--     role. Hoje o usuário consegue se aprovar dando UPDATE em profiles.
--
-- Teste primeiro trocando `commit;` por `rollback;`: a guarda no fim aborta
-- se a cópia ou a contagem de mentores não bater.

begin;

-- 1. Tabela ----------------------------------------------------------------

create table if not exists public.mentor_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  experience_years integer,
  free_topics text[],
  inclusive_tags text[],
  mentorship_approach text,
  what_to_expect text,
  ideal_mentee text,
  is_volunteer boolean not null default false,
  chat_enabled boolean not null default false,
  availability_status text not null default 'available'
    check (availability_status in ('available', 'busy', 'unavailable')),
  verification_status text
    check (verification_status in ('pending', 'approved', 'rejected')),
  verified_at timestamptz,
  verification_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.mentor_profiles is
  'Dados de mentor (1:1 com profiles). verification_status é a única fonte da verificação; verified/is_pending_mentor são calculados em mentors_view.';

drop trigger if exists update_mentor_profiles_updated_at on public.mentor_profiles;
create trigger update_mentor_profiles_updated_at
  before update on public.mentor_profiles
  for each row execute function public.update_updated_at_column();

-- 2. RLS e grants ------------------------------------------------------------

alter table public.mentor_profiles enable row level security;

drop policy if exists "Read mentor profiles" on public.mentor_profiles;
create policy "Read mentor profiles"
  on public.mentor_profiles
  for select
  to anon, authenticated
  using (
    user_id = (select auth.uid())
    or public.is_admin()
    or (public.profile_is_mentor(user_id)
        and exists (select 1 from public.profiles p
                    where p.id = mentor_profiles.user_id and coalesce(p.is_public, false)))
    or public.shares_mentorship_with(user_id)
  );

drop policy if exists "Mentor inserts own profile" on public.mentor_profiles;
create policy "Mentor inserts own profile"
  on public.mentor_profiles
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Mentor updates own profile" on public.mentor_profiles;
create policy "Mentor updates own profile"
  on public.mentor_profiles
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Admins manage mentor profiles" on public.mentor_profiles;
create policy "Admins manage mentor profiles"
  on public.mentor_profiles
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on public.mentor_profiles from anon, authenticated;

grant select (user_id, experience_years, free_topics, inclusive_tags,
              mentorship_approach, what_to_expect, ideal_mentee, is_volunteer,
              chat_enabled, availability_status, verification_status,
              verified_at, created_at, updated_at)
  on public.mentor_profiles to anon, authenticated;

grant insert (user_id, experience_years, free_topics, inclusive_tags,
              mentorship_approach, what_to_expect, ideal_mentee, is_volunteer,
              chat_enabled, availability_status)
  on public.mentor_profiles to authenticated;

grant update (experience_years, free_topics, inclusive_tags,
              mentorship_approach, what_to_expect, ideal_mentee, is_volunteer,
              chat_enabled, availability_status)
  on public.mentor_profiles to authenticated;

grant delete on public.mentor_profiles to authenticated; -- só a policy de admin libera
grant all on public.mentor_profiles to service_role;

-- 3. Cópia -------------------------------------------------------------------
-- Mentores (papel em user_roles) + candidatos pending/rejected. Ficam de fora
-- os mentorados com 'approved' gravado pelo fim do onboarding: para eles o
-- status não significa nada.

insert into public.mentor_profiles (
  user_id, experience_years, free_topics, inclusive_tags, mentorship_approach,
  what_to_expect, ideal_mentee, is_volunteer, chat_enabled, availability_status,
  verification_status, verified_at, verification_notes
)
select p.id, p.experience_years, p.free_topics, p.inclusive_tags, p.mentorship_approach,
       p.what_to_expect, p.ideal_mentee, coalesce(p.is_volunteer, false),
       coalesce(p.chat_enabled, false), coalesce(p.availability_status, 'available'),
       p.verification_status, p.verified_at, p.verification_notes
from public.profiles p
where public.profile_is_mentor(p.id)
   or p.verification_status in ('pending', 'rejected')
on conflict (user_id) do nothing;

-- 4. Trigger de transição (sai no contract) ---------------------------------
-- Enquanto o código antigo grava em profiles, copia para mentor_profiles só
-- as colunas que mudaram nesse UPDATE (nunca sobrescreve com valor velho).
-- security definer: rotas antigas gravam profiles com o cliente do usuário,
-- que não tem grant nas colunas de verificação de mentor_profiles.

create or replace function public.profiles_mirror_mentor_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.mentor_profiles where user_id = new.id) then
    -- Sem registro: só cria para mentor ou candidato. O 'approved' que o
    -- onboarding antigo grava para mentorado é ignorado.
    if public.profile_is_mentor(new.id)
       or new.verification_status in ('pending', 'rejected') then
      insert into public.mentor_profiles (
        user_id, experience_years, free_topics, inclusive_tags, mentorship_approach,
        what_to_expect, ideal_mentee, is_volunteer, chat_enabled, availability_status,
        verification_status, verified_at, verification_notes
      ) values (
        new.id, new.experience_years, new.free_topics, new.inclusive_tags, new.mentorship_approach,
        new.what_to_expect, new.ideal_mentee, coalesce(new.is_volunteer, false),
        coalesce(new.chat_enabled, false), coalesce(new.availability_status, 'available'),
        new.verification_status, new.verified_at, new.verification_notes
      )
      on conflict (user_id) do nothing;
    end if;
    return new;
  end if;

  update public.mentor_profiles m set
    experience_years    = case when new.experience_years    is distinct from old.experience_years    then new.experience_years    else m.experience_years    end,
    free_topics         = case when new.free_topics         is distinct from old.free_topics         then new.free_topics         else m.free_topics         end,
    inclusive_tags      = case when new.inclusive_tags      is distinct from old.inclusive_tags      then new.inclusive_tags      else m.inclusive_tags      end,
    mentorship_approach = case when new.mentorship_approach is distinct from old.mentorship_approach then new.mentorship_approach else m.mentorship_approach end,
    what_to_expect      = case when new.what_to_expect      is distinct from old.what_to_expect      then new.what_to_expect      else m.what_to_expect      end,
    ideal_mentee        = case when new.ideal_mentee        is distinct from old.ideal_mentee        then new.ideal_mentee        else m.ideal_mentee        end,
    is_volunteer        = case when new.is_volunteer        is distinct from old.is_volunteer        then coalesce(new.is_volunteer, false) else m.is_volunteer end,
    chat_enabled        = case when new.chat_enabled        is distinct from old.chat_enabled        then coalesce(new.chat_enabled, false) else m.chat_enabled end,
    availability_status = case when new.availability_status is distinct from old.availability_status then coalesce(new.availability_status, 'available') else m.availability_status end,
    verification_status = case when new.verification_status is distinct from old.verification_status then new.verification_status else m.verification_status end,
    verified_at         = case when new.verified_at         is distinct from old.verified_at         then new.verified_at         else m.verified_at         end,
    verification_notes  = case when new.verification_notes  is distinct from old.verification_notes  then new.verification_notes  else m.verification_notes  end
  where m.user_id = new.id;

  return new;
end;
$$;

revoke execute on function public.profiles_mirror_mentor_fields() from public, anon, authenticated;

drop trigger if exists profiles_mirror_mentor_fields on public.profiles;
create trigger profiles_mirror_mentor_fields
  after update on public.profiles
  for each row execute function public.profiles_mirror_mentor_fields();

-- 5. Verificação pelo próprio usuário ----------------------------------------

create or replace function public.request_mentor_verification()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  -- Quem já está aprovado continua aprovado.
  insert into public.mentor_profiles (user_id, verification_status)
  values (auth.uid(), 'pending')
  on conflict (user_id) do update
    set verification_status = 'pending', verified_at = null
    where mentor_profiles.verification_status is distinct from 'approved';
end;
$$;

create or replace function public.withdraw_mentor_verification()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  update public.mentor_profiles
    set verification_status = null, verified_at = null
    where user_id = auth.uid();
end;
$$;

revoke execute on function public.request_mentor_verification() from public, anon;
revoke execute on function public.withdraw_mentor_verification() from public, anon;
grant execute on function public.request_mentor_verification() to authenticated;
grant execute on function public.withdraw_mentor_verification() to authenticated;

-- 6. mentors_view lendo de mentor_profiles -----------------------------------
-- Mesma ordem e tipos de colunas (create or replace exige).

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
    p.academic_level,
    p.institution,
    p.course,
    p.expected_graduation,
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
    p.cv_url,
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
  left join public.mentor_stats ms on ms.mentor_id = p.id
where exists (select 1
                from public.user_roles ur
                join public.roles r on ur.role_id = r.id
               where ur.user_id = p.id and r.name = 'mentor'::text);

-- 7. handle_new_user sem `verified` (a coluna sai no contract) --------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'auth'
as $$
declare
  user_slug text;
  profile_names record;
begin
  select * into profile_names
  from public.profile_names_from_metadata(new.raw_user_meta_data);

  -- Safe slug
  user_slug := split_part(new.email, '@', 1) || '-' || substr(new.id::text, 1, 5);

  -- Create profile
  insert into public.profiles (id, email, first_name, last_name, slug, created_at, updated_at)
  values (new.id, new.email, profile_names.first_name, profile_names.last_name, user_slug, now(), now())
  on conflict (id) do update set email = excluded.email, updated_at = now();

  -- Default role 'mentee', looked up by name
  insert into public.user_roles (user_id, role_id)
  select new.id, id from public.roles where name = 'mentee' limit 1
  on conflict do nothing;

  return new;
end;
$$;

-- 8. Guarda ------------------------------------------------------------------

do $$
declare
  esperado int;
  copiados int;
  mentores_view int;
  mentores_sem_registro int;
  verificados_view int;
begin
  select count(*) into esperado from public.profiles p
   where public.profile_is_mentor(p.id) or p.verification_status in ('pending', 'rejected');
  select count(*) into copiados from public.mentor_profiles;
  select count(*) into mentores_view from public.mentors_view;
  select count(*) into mentores_sem_registro from public.mentors_view v
   where not exists (select 1 from public.mentor_profiles m where m.user_id = v.id);
  select count(*) into verificados_view from public.mentors_view where verified;

  if copiados <> esperado then
    raise exception 'mentor_profiles tem % linhas, esperado %', copiados, esperado;
  end if;
  if mentores_view <> 13 then
    raise exception 'mentors_view tem % mentores, esperado 13', mentores_view;
  end if;
  if mentores_sem_registro > 0 then
    raise exception '% mentores sem linha em mentor_profiles', mentores_sem_registro;
  end if;
  if verificados_view <> 13 then
    raise exception 'mentors_view tem % verificados, esperado 13', verificados_view;
  end if;
end $$;

commit;

-- Verificação (esperado: 15 linhas = 13 mentores approved + 2 rejected):
--   select verification_status, count(*) from public.mentor_profiles group by 1;
--
-- RESYNC (rode logo depois do deploy): o trigger de transição já espelha as
-- edições; isto só cobre quem virou mentor sem tocar em profiles depois.
--   insert into public.mentor_profiles (user_id, verification_status, verified_at)
--   select p.id, 'approved', coalesce(p.verified_at, now())
--   from public.profiles p
--   where public.profile_is_mentor(p.id)
--     and not exists (select 1 from public.mentor_profiles m where m.user_id = p.id)
--   on conflict (user_id) do nothing;
