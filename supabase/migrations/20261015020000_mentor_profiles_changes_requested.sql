-- Adiciona o status 'changes_requested' a mentor_profiles.verification_status
--
-- Por quê: ao pedir ajustes para um candidato a mentor (ex: Otelmo, Lucas, Davi),
-- o sistema gravava 'rejected', jogando-o na aba de concluídos/recusados.
-- O status correto é 'changes_requested', mantendo a candidatura em análise
-- com pendência de ajustes pelo próprio mentor.

-- 1. Atualizar constraint de status em mentor_profiles -------------------------
alter table public.mentor_profiles
  drop constraint if exists mentor_profiles_verification_status_check;

alter table public.mentor_profiles
  add constraint mentor_profiles_verification_status_check
  check (verification_status in ('pending', 'approved', 'rejected', 'changes_requested'));

-- 2. Migrar mentores com ajustes solicitados para o status correto ------------
update public.mentor_profiles
set verification_status = 'changes_requested',
    updated_at = now()
where verification_notes = 'Ajustes solicitados via assistente de IA'
  and verification_status = 'rejected';
