-- ============================================================================
-- Verificação de mentores: uma única fonte de verdade
-- ============================================================================
-- Problema: `profiles` tinha quatro colunas contando a mesma história de jeitos
-- diferentes (`verification_status`, `verified`, `is_pending_mentor`,
-- `verified_at`), escritas por telas diferentes:
--   * /dashboard/admin/verifications  → escrevia `verification_status`
--   * modal de /dashboard/admin/users  → escrevia só `verified`
--   * /dashboard/admin/users/manage    → escrevia só `verified`
-- e `verification_status` tinha DEFAULT 'pending', então TODO cadastro nascia
-- "pendente" — a fila de verificação e os contadores do painel nunca batiam.
--
-- Modelo daqui pra frente (ver docs/domains/mentor-verification.md):
--   * "É mentor"              = role `mentor` em `user_roles` (inalterado)
--   * Candidatura a mentor    = `verification_status`:
--                                 NULL      → nunca pediu
--                                 pending   → pediu, aguardando admin
--                                 approved  → aprovado
--                                 rejected  → admin pediu ajustes
--   * `is_pending_mentor`     = espelho derivado (verification_status = 'pending'),
--                               mantido só por compatibilidade de leitura.
--   * `verified`/`verified_at` = selo público; ligados automaticamente na
--                               transição para 'approved'.
--   * Aparecer em /mentors    = role mentor + `is_public` + tópicos preenchidos
--                               (a aprovação liga `is_public`; o mentor pode
--                               desligar depois pelo próprio perfil).
-- ============================================================================

-- 0. Backup dos valores atuais (reversível). Sem policies: só service role lê.
CREATE TABLE IF NOT EXISTS public._backup_profiles_verification_20260925 AS
SELECT id, verification_status, verified, verified_at, is_pending_mentor, is_public, now() AS backed_up_at
FROM public.profiles;

ALTER TABLE public._backup_profiles_verification_20260925 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public._backup_profiles_verification_20260925 FROM anon, authenticated;

-- 1. Valor legado fora do vocabulário.
UPDATE public.profiles SET verification_status = 'approved'
WHERE verification_status = 'verified';

-- 2. Mentores ativos (role mentor + selo verified) aprovados por telas que só
--    mexiam em `verified` ficaram com status 'pending' — normaliza.
UPDATE public.profiles p
SET verification_status = 'approved',
    verified_at = COALESCE(p.verified_at, p.updated_at)
WHERE p.verified = true
  AND p.verification_status IS DISTINCT FROM 'approved'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = p.id AND r.name = 'mentor'
  );

-- 3. Quem está 'pending' só por causa do DEFAULT (não pediu para ser mentor e
--    não é mentor) volta para NULL.
UPDATE public.profiles p
SET verification_status = NULL
WHERE p.verification_status = 'pending'
  AND COALESCE(p.is_pending_mentor, false) = false
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = p.id AND r.name = 'mentor'
  );

-- 4. Mentores aprovados que ficaram invisíveis porque a aprovação não
--    publicava o perfil (caso Bianca Dias, 2026-09-25).
UPDATE public.profiles p
SET is_public = true
WHERE p.verification_status = 'approved'
  AND COALESCE(p.is_public, false) = false
  AND COALESCE(p.is_pending_mentor, false) = true
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = p.id AND r.name = 'mentor'
  );

-- 5. Novo cadastro não é candidatura.
ALTER TABLE public.profiles ALTER COLUMN verification_status DROP DEFAULT;

-- 6. Vocabulário fechado.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_verification_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_verification_status_check
  CHECK (verification_status IS NULL OR verification_status IN ('pending', 'approved', 'rejected'));

-- 7. Colunas derivadas sincronizadas no banco, qualquer que seja a tela que escreva.
CREATE OR REPLACE FUNCTION public.sync_profile_verification_flags()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.is_pending_mentor := COALESCE(NEW.verification_status = 'pending', false);

  IF NEW.verification_status = 'approved'
     AND (TG_OP = 'INSERT' OR OLD.verification_status IS DISTINCT FROM 'approved') THEN
    NEW.verified := true;
    NEW.verified_at := COALESCE(NEW.verified_at, now());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_verification_flags ON public.profiles;
CREATE TRIGGER sync_profile_verification_flags
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_verification_flags();

-- Aplica o espelho nas linhas existentes (dispara o trigger).
UPDATE public.profiles
SET is_pending_mentor = COALESCE(verification_status = 'pending', false)
WHERE is_pending_mentor IS DISTINCT FROM COALESCE(verification_status = 'pending', false);

COMMENT ON COLUMN public.profiles.verification_status IS
  'Candidatura a mentor: NULL (nunca pediu) | pending | approved | rejected. Fonte de verdade; is_pending_mentor e verified são derivados via trigger sync_profile_verification_flags.';
COMMENT ON COLUMN public.profiles.is_pending_mentor IS
  'DERIVADO de verification_status = ''pending'' (trigger). Não escreva diretamente.';
