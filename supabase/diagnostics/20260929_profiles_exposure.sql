-- Diagnóstico SOMENTE LEITURA da exposição de colunas de public.profiles.
-- Rodar no SQL Editor do Supabase (produção) e colar o resultado de cada
-- bloco de volta para quem vai escrever a migração de correção.
-- Nada aqui altera dados: o bloco 6 usa BEGIN/ROLLBACK só para simular papéis.
-- Ver docs/COMMUNITY_CONTACT_PLAN.md §2.

-- 1. Todas as policies de profiles (a correção precisa conhecer cada uma)
select policyname, cmd, roles, permissive, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'profiles'
order by policyname;

-- 2. A migração 20260928000004_community_rls já foi aplicada?
select version, name
from supabase_migrations.schema_migrations
where version >= '20260928000000'
order by version;

-- 3. Privilégios de tabela e de coluna para anon/authenticated
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'profiles'
  and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;

select grantee, count(*) as colunas_com_select
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'profiles'
  and grantee in ('anon', 'authenticated') and privilege_type = 'SELECT'
group by grantee;

-- 4. Views que leem profiles: dono, security_invoker e definição
select c.relname as view_name,
       pg_get_userbyid(c.relowner) as owner,
       coalesce(c.reloptions::text, '(sem opções: roda como o dono, ignora RLS)') as options
from information_schema.view_table_usage v
join pg_class c on c.relname = v.view_name
join pg_namespace n on n.oid = c.relnamespace and n.nspname = v.view_schema
where v.table_schema = 'public' and v.table_name = 'profiles';

select pg_get_viewdef('public.mentors_view'::regclass, true) as mentors_view_sql;

-- 5. Funções SECURITY DEFINER que tocam profiles (podem expor colunas)
select p.proname, pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
  and pg_get_functiondef(p.oid) ilike '%profiles%'
order by p.proname;

-- 6. Prova da exposição: o que um visitante anônimo enxerga
begin;
set local role anon;
select count(*)            as linhas_visiveis_para_anon,
       count(email)        as emails_visiveis,
       count(phone)        as telefones_visiveis,
       count(original_data) as original_data_visivel
from public.profiles;
rollback;
