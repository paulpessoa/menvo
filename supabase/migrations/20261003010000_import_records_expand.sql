-- Fase 1 de docs/domains/profiles-schema.md, etapa "expand".
--
-- Cria import_records (1:1 com profiles) e copia os 4 campos de importação do
-- JotForm. NÃO apaga nada de profiles: o código antigo continua funcionando
-- até o deploy; as colunas só saem na migração
-- 20261003020000_import_records_contract.sql, depois do deploy.
--
-- Quem tem linha aqui: perfis com original_data, external_id ou invite_sent_at,
-- ou com origin_platform diferente do padrão 'menvo'. Os demais não têm linha.
-- origin_platform = 'menvo' numa linha existente significa "isento da
-- retenção" (é o que /api/admin/retention/exempt faz), igual ao comportamento
-- de antes.
--
-- Segurança: leitura só para admin (is_admin()); escrita só por service_role
-- nas rotas /api/admin. anon e authenticated não escrevem.
--
-- A cópia é idempotente. Rode o bloco "RESYNC" do rodapé logo depois do
-- deploy para recolher convites enviados entre esta migração e o deploy.

begin;

create table if not exists public.import_records (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  origin_platform text not null default 'menvo',
  external_id text,
  original_data jsonb,
  invite_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.import_records is
  'Dados de quem veio de importação (JotForm / Estágio Recife). Privada: só admin lê. origin_platform = ''menvo'' aqui significa isento da retenção.';

alter table public.import_records enable row level security;

drop policy if exists "Admins read import records" on public.import_records;
create policy "Admins read import records"
  on public.import_records
  for select
  to authenticated
  using (public.is_admin());

revoke all on public.import_records from anon, authenticated;
grant select on public.import_records to authenticated;
grant all on public.import_records to service_role;

insert into public.import_records (user_id, origin_platform, external_id, original_data, invite_sent_at)
select p.id, coalesce(p.origin_platform, 'menvo'), p.external_id, p.original_data, p.invite_sent_at
from public.profiles p
where p.original_data is not null
   or p.external_id is not null
   or p.invite_sent_at is not null
   or coalesce(p.origin_platform, 'menvo') <> 'menvo'
on conflict (user_id) do update
  set origin_platform = excluded.origin_platform,
      external_id = excluded.external_id,
      original_data = excluded.original_data,
      invite_sent_at = excluded.invite_sent_at,
      updated_at = now();

commit;

-- Verificação (deve dar 605 linhas, 559 jotform, 603 com original_data):
--   select count(*), count(*) filter (where origin_platform = 'jotform'),
--          count(original_data)
--   from public.import_records;
--
-- RESYNC (rode logo depois do deploy; só traz o que mudou em profiles):
--   insert into public.import_records (user_id, origin_platform, external_id, original_data, invite_sent_at)
--   select p.id, coalesce(p.origin_platform, 'menvo'), p.external_id, p.original_data, p.invite_sent_at
--   from public.profiles p
--   where p.original_data is not null or p.external_id is not null
--      or p.invite_sent_at is not null or coalesce(p.origin_platform, 'menvo') <> 'menvo'
--   on conflict (user_id) do update
--     set invite_sent_at = greatest(import_records.invite_sent_at, excluded.invite_sent_at);
