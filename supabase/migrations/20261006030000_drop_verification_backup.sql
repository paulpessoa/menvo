-- Apaga public._backup_profiles_verification_20260925: cópia de 2026-09-25 do
-- estado antigo de verificação (verification_status, verified, verified_at,
-- is_pending_mentor, is_public), feita antes da Fase 2 de
-- docs/domains/profiles-schema.md. Hoje esse estado vive em mentor_profiles, a
-- Fase 2 está conferida e a tabela não tem uso no código. Manter dado pessoal
-- parado sem finalidade vai contra o princípio de necessidade da LGPD.
--
-- ANTES DE APLICAR: o conteúdo (718 linhas) foi exportado para
-- backup_profiles_verification_20260925.csv.
--
-- Sem CASCADE: a guarda aborta se algo depender da tabela.
-- Teste primeiro trocando `commit;` por `rollback;`.

begin;

do $$
declare
  dependentes int;
  funcoes int;
begin
  select count(*) into dependentes
    from pg_depend d
   where d.refobjid = 'public._backup_profiles_verification_20260925'::regclass
     and d.deptype = 'n';

  select count(*) into funcoes
    from pg_proc
   where pronamespace = 'public'::regnamespace
     and prosrc ilike '%_backup_profiles_verification%';

  if dependentes > 0 or funcoes > 0 then
    raise exception 'Ainda há % objetos e % funções dependendo do backup', dependentes, funcoes;
  end if;
end $$;

drop table public._backup_profiles_verification_20260925;

do $$
begin
  if to_regclass('public._backup_profiles_verification_20260925') is not null then
    raise exception 'a tabela de backup continua existindo';
  end if;
end $$;

commit;
