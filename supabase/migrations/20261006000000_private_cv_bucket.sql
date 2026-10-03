-- Bucket `cvs` privado.
--
-- Antes: bucket público + policy `public_can_view_cvs` (SELECT em todo o
-- bucket para qualquer papel). Qualquer visitante anônimo listava as pastas
-- (ids de usuário) e baixava os 274 PDFs, mesmo com `mentee_profiles.cv_url`
-- fechado na Fase 3 de docs/domains/profiles-schema.md.
--
-- Depois:
--   * bucket privado; leitura só do dono (a própria pasta). Quem tem acesso ao
--     currículo (próprio, admin, mentor com mentoria) recebe do servidor uma
--     URL assinada de 1h (lib/services/mentees/cv-storage.ts);
--   * cv_url guarda o caminho do arquivo, não a URL pública. Upload do site:
--     `<user_id>/cv-<ts>.pdf`; importação JotForm: `estagio-recife/<user_id>_cv.pdf`.
--     Valor que não é arquivo do próprio usuário (ex.: 'teste', '') vira null;
--   * o usuário perde insert/update em cv_url: só /api/upload/cv grava. Sem
--     isso, alguém poderia apontar o próprio registro para o arquivo de outra
--     pessoa (o código também recusa, isto é a segunda barreira).
--
-- APLIQUE SOMENTE DEPOIS do deploy do código que gera URL assinada: o código
-- antigo devolve a URL pública, que para de funcionar com o bucket privado.
--
-- Teste primeiro com o arquivo de teste (termina em `rollback;`).

begin;

-- 1. Bucket e policies -------------------------------------------------------

update storage.buckets set public = false where id = 'cvs';

drop policy if exists public_can_view_cvs on storage.objects;

drop policy if exists users_can_view_own_cv on storage.objects;
create policy users_can_view_own_cv
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'cvs' and (select auth.uid())::text = (storage.foldername(name))[1]);

-- 2. cv_url: caminho em vez de URL --------------------------------------------

update public.mentee_profiles m
   set cv_url = case
     when s.path like m.user_id::text || '/%' and s.path ~* '^[^/]+/[\w.-]+\.pdf$' then s.path
     when s.path = 'estagio-recife/' || m.user_id::text || '_cv.pdf' then s.path
     else null
   end
  from (
    select user_id,
           coalesce(substring(cv_url from '/storage/v1/object/public/cvs/(.*)$'), cv_url) as path
      from public.mentee_profiles
     where cv_url is not null
  ) s
 where s.user_id = m.user_id;

-- 3. Só o servidor grava cv_url --------------------------------------------------

revoke insert (cv_url), update (cv_url) on public.mentee_profiles from authenticated;

-- 4. Guarda ------------------------------------------------------------------

do $$
declare
  publico boolean;
  politicas_publicas int;
  caminhos int;
  sem_arquivo int;
  urls int;
  grant_escrita int;
begin
  select public into publico from storage.buckets where id = 'cvs';

  select count(*) into politicas_publicas
    from pg_policy
   where polrelid = 'storage.objects'::regclass
     and polcmd in ('r', '*')
     and coalesce(pg_get_expr(polqual, polrelid), '') ilike '%cvs%'
     and coalesce(pg_get_expr(polqual, polrelid), '') not ilike '%auth.uid()%';

  select count(*) into caminhos from public.mentee_profiles where cv_url is not null;

  select count(*) into sem_arquivo
    from public.mentee_profiles m
   where m.cv_url is not null
     and not exists (select 1 from storage.objects o where o.bucket_id = 'cvs' and o.name = m.cv_url);

  select count(*) into urls from public.mentee_profiles where cv_url like 'http%';

  select count(*) into grant_escrita
    from pg_attribute a, aclexplode(a.attacl) ac
   where a.attrelid = 'public.mentee_profiles'::regclass
     and a.attname = 'cv_url'
     and ac.grantee = 'authenticated'::regrole
     and ac.privilege_type in ('INSERT', 'UPDATE');

  if publico then
    raise exception 'bucket cvs continua público';
  end if;
  if politicas_publicas > 0 then
    raise exception '% policies de leitura em cvs sem checar o dono', politicas_publicas;
  end if;
  if caminhos <> 256 then
    raise exception 'mentee_profiles tem % currículos, esperado 256', caminhos;
  end if;
  if sem_arquivo > 0 then
    raise exception '% caminhos sem arquivo no bucket', sem_arquivo;
  end if;
  if urls > 0 then
    raise exception '% cv_url ainda são URL', urls;
  end if;
  if grant_escrita > 0 then
    raise exception 'authenticated ainda grava cv_url';
  end if;
end $$;

commit;

-- Verificação (anon não deve listar nem baixar):
--   curl -X POST https://<ref>.supabase.co/storage/v1/object/list/cvs \
--     -H "apikey: <publishable>" -H "Content-Type: application/json" -d '{"prefix":""}'
--   -> []
