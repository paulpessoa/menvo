-- Fase 1 de docs/domains/profiles-schema.md, etapa "contract".
--
-- APLIQUE SOMENTE DEPOIS que o código que lê import_records estiver em
-- produção E depois do bloco RESYNC de 20261003010000_import_records_expand.sql.
-- O código antigo ainda lê estas colunas de profiles; apagá-las antes do
-- deploy derruba a lista de usuários do admin, os convites e a retenção.
--
-- Apaga origin_platform, external_id, original_data e invite_sent_at de
-- profiles (agora em import_records). Sem CASCADE; a guarda aborta se algo
-- ainda depender delas. Antes, confere que nenhuma linha ficaria sem cópia.
--
-- ANTES DE APLICAR: exporte as colunas (CSV) para ter rollback, ex.:
--   select id, origin_platform, external_id, original_data, invite_sent_at
--   from public.profiles
--   where original_data is not null or external_id is not null
--      or invite_sent_at is not null or origin_platform <> 'menvo';

begin;

do $$
declare
  sem_copia int;
  dependents text;
begin
  -- Toda linha com dado de importação precisa ter registro idêntico em import_records.
  select count(*) into sem_copia
  from public.profiles p
  left join public.import_records ir on ir.user_id = p.id
  where (p.original_data is not null or p.external_id is not null
         or p.invite_sent_at is not null or coalesce(p.origin_platform, 'menvo') <> 'menvo')
    and (ir.user_id is null
         or ir.original_data is distinct from p.original_data
         or ir.external_id is distinct from p.external_id
         or ir.invite_sent_at is distinct from p.invite_sent_at
         or ir.origin_platform is distinct from coalesce(p.origin_platform, 'menvo'));

  if sem_copia > 0 then
    raise exception '% perfis ainda não estão copiados em import_records. Rode o RESYNC antes.', sem_copia;
  end if;

  select string_agg(distinct d.classid::regclass::text || ' ' || d.objid, ', ')
    into dependents
  from pg_depend d
  join pg_attribute a on a.attrelid = d.refobjid and a.attnum = d.refobjsubid
  where d.refobjid = 'public.profiles'::regclass
    and a.attname in ('origin_platform', 'external_id', 'original_data', 'invite_sent_at')
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

  select string_agg(distinct p.proname, ', ')
    into dependents
  from pg_proc p
  where p.pronamespace = 'public'::regnamespace
    and p.prosrc ~* '\m(origin_platform|external_id|original_data|invite_sent_at)\M';

  if dependents is not null then
    raise exception 'Funções ainda citam colunas a apagar: %', dependents;
  end if;
end $$;

alter table public.profiles
  drop column origin_platform,
  drop column external_id,
  drop column original_data,
  drop column invite_sent_at;

commit;

-- Verificação depois de aplicar:
--   select count(*) from information_schema.columns
--   where table_schema = 'public' and table_name = 'profiles';   -- 48
--   select count(*), count(original_data) from public.import_records; -- 605, 603
