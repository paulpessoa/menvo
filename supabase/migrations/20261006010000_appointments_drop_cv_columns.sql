-- Apaga appointments.cv_url e appointments.cv_type: vazias nas 6 linhas e sem
-- uso no código (medido em 2026-10-02). O currículo mora em
-- mentee_profiles.cv_url e sai por /api/cv/<userId>.
--
-- O check appointments_cv_type_check cai junto com a coluna. Sem CASCADE: a
-- guarda aborta se houver dado ou qualquer outra dependência (view, função,
-- coluna gerada).
--
-- Teste primeiro trocando `commit;` por `rollback;`.

begin;

do $$
declare
  preenchidas int;
  dependents text;
begin
  select count(*) into preenchidas
    from public.appointments
   where coalesce(cv_url, '') <> '' or coalesce(cv_type, '') <> '';

  if preenchidas > 0 then
    raise exception '% agendamentos com cv_url/cv_type preenchido', preenchidas;
  end if;

  -- Tudo que depende das colunas, exceto o próprio check de cv_type.
  select string_agg(distinct d.classid::regclass::text || ' ' || d.objid, ', ')
    into dependents
    from pg_depend d
    join pg_attribute a on a.attrelid = d.refobjid and a.attnum = d.refobjsubid
   where d.refobjid = 'public.appointments'::regclass
     and a.attname in ('cv_url', 'cv_type')
     and d.deptype = 'n'
     and not exists (
       select 1 from pg_constraint c
        where c.oid = d.objid and d.classid = 'pg_constraint'::regclass
          and c.conname = 'appointments_cv_type_check'
     );

  if dependents is not null then
    raise exception 'Ainda há objetos dependendo das colunas: %', dependents;
  end if;

  -- profile_cv_url cita cv_url, mas de mentee_profiles.
  select string_agg(distinct p.proname, ', ')
    into dependents
    from pg_proc p
   where p.pronamespace = 'public'::regnamespace
     and p.proname <> 'profile_cv_url'
     and p.prosrc ~ '\mcv_(url|type)\M';

  if dependents is not null then
    raise exception 'Funções ainda citam as colunas: %', dependents;
  end if;
end $$;

alter table public.appointments
  drop column cv_url,
  drop column cv_type;

do $$
declare
  colunas int;
  linhas int;
begin
  select count(*) into colunas
    from information_schema.columns
   where table_schema = 'public' and table_name = 'appointments';
  select count(*) into linhas from public.appointments;

  if colunas <> 35 then
    raise exception 'appointments ficou com % colunas, esperado 35', colunas;
  end if;
  if linhas <> 6 then
    raise exception 'appointments tem % linhas, esperado 6', linhas;
  end if;
end $$;

commit;
