-- Fase 2 de docs/domains/profiles-schema.md, etapa "contract".
--
-- APLIQUE SOMENTE DEPOIS que o código que lê/grava mentor_profiles estiver em
-- produção E depois do bloco RESYNC de 20261004000000_mentor_profiles_expand.sql.
-- O código antigo ainda lê e grava estas colunas em profiles; apagá-las antes
-- do deploy derruba /api/auth/me, /api/profile, o onboarding e a aprovação.
--
-- Apaga de profiles as 12 colunas que foram para mentor_profiles e as 2 que
-- viraram cálculo (verified, is_pending_mentor), junto com:
--   * trigger/função profiles_mirror_mentor_fields (transição do expand);
--   * trigger/função sync_profile_verification_flags (derivava verified e
--     is_pending_mentor; agora calculados em mentors_view);
--   * função update_profiles_search_vector (sem trigger, citava free_topics e
--     inclusive_tags; o trigger em uso é update_profile_search_vector).
-- Índices e checks dessas colunas caem junto com elas. Sem CASCADE: a guarda
-- aborta se algo mais ainda depender delas.
--
-- ANTES DE APLICAR: exporte as colunas (CSV) para ter rollback, ex.:
--   select id, experience_years, free_topics, inclusive_tags, mentorship_approach,
--          what_to_expect, ideal_mentee, is_volunteer, chat_enabled, availability_status,
--          verification_status, verified_at, verification_notes, is_pending_mentor, verified
--   from public.profiles;
--
-- Teste primeiro trocando `commit;` por `rollback;`.

begin;

drop trigger if exists profiles_mirror_mentor_fields on public.profiles;
drop function if exists public.profiles_mirror_mentor_fields();

drop trigger if exists sync_profile_verification_flags on public.profiles;
drop function if exists public.sync_profile_verification_flags();

drop function if exists public.update_profiles_search_vector();

do $$
declare
  sem_copia int;
  dependents text;
begin
  -- Todo mentor e todo candidato (pending/rejected) precisa ter linha em
  -- mentor_profiles. Se faltar, rode o RESYNC do expand antes.
  select count(*) into sem_copia
  from public.profiles p
  where (public.profile_is_mentor(p.id) or p.verification_status in ('pending', 'rejected'))
    and not exists (select 1 from public.mentor_profiles m where m.user_id = p.id);

  if sem_copia > 0 then
    raise exception '% mentores/candidatos sem linha em mentor_profiles. Rode o RESYNC antes.', sem_copia;
  end if;

  select string_agg(distinct d.classid::regclass::text || ' ' || d.objid, ', ')
    into dependents
  from pg_depend d
  join pg_attribute a on a.attrelid = d.refobjid and a.attnum = d.refobjsubid
  where d.refobjid = 'public.profiles'::regclass
    and a.attname in ('experience_years', 'free_topics', 'inclusive_tags', 'mentorship_approach',
                      'what_to_expect', 'ideal_mentee', 'is_volunteer', 'chat_enabled',
                      'availability_status', 'verification_status', 'verified_at',
                      'verification_notes', 'is_pending_mentor', 'verified')
    and d.deptype = 'n'
    and d.classid <> 'pg_attrdef'::regclass
    and not exists (
      select 1 from pg_constraint c
      where c.oid = d.objid and d.classid = 'pg_constraint'::regclass
        and c.contype = 'c' and c.conrelid = 'public.profiles'::regclass
    );

  if dependents is not null then
    raise exception 'Ainda há objetos dependendo das colunas a apagar: %', dependents;
  end if;

  -- request_/withdraw_mentor_verification usam os mesmos nomes, mas em
  -- mentor_profiles; qualquer outra função que cite as colunas aborta.
  select string_agg(distinct p.proname, ', ')
    into dependents
  from pg_proc p
  where p.pronamespace = 'public'::regnamespace
    and p.proname not in ('request_mentor_verification', 'withdraw_mentor_verification')
    and p.prosrc ~ '\m(experience_years|free_topics|inclusive_tags|mentorship_approach|what_to_expect|ideal_mentee|is_volunteer|chat_enabled|availability_status|verification_status|verified_at|verification_notes|is_pending_mentor|verified)\M';

  if dependents is not null then
    raise exception 'Funções ainda citam colunas a apagar: %', dependents;
  end if;
end $$;

alter table public.profiles
  drop column experience_years,
  drop column free_topics,
  drop column inclusive_tags,
  drop column mentorship_approach,
  drop column what_to_expect,
  drop column ideal_mentee,
  drop column is_volunteer,
  drop column chat_enabled,
  drop column availability_status,
  drop column verification_status,
  drop column verified_at,
  drop column verification_notes,
  drop column is_pending_mentor,
  drop column verified;

do $$
declare
  colunas int;
  na_view int;
  com_papel int;
begin
  select count(*) into colunas
  from information_schema.columns
  where table_schema = 'public' and table_name = 'profiles';

  select count(*) into na_view from public.mentors_view;

  select count(distinct ur.user_id) into com_papel
  from public.user_roles ur join public.roles r on r.id = ur.role_id
  where r.name = 'mentor';

  if colunas <> 34 then
    raise exception 'profiles ficou com % colunas, esperado 34', colunas;
  end if;
  if na_view <> com_papel then
    raise exception 'mentors_view tem % mentores, mas % têm o papel', na_view, com_papel;
  end if;
end $$;

commit;

-- Verificação depois de aplicar:
--   select count(*) from information_schema.columns
--   where table_schema = 'public' and table_name = 'profiles';      -- 34
--   select count(*), count(*) filter (where verified) from public.mentors_view;
