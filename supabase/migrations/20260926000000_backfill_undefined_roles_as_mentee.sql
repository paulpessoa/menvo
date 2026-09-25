-- ============================================================================
-- Backfill: usuários sem role (nem mentor, nem mentee) viram mentee
-- ============================================================================
-- Contexto: alguns perfis nunca receberam nenhuma linha em `user_roles`
-- (cadastros antigos, falhas de trigger, importações manuais). Sem role
-- 'mentor' nem 'mentee', esses usuários ficam "indefinidos" — não aparecem
-- como mentor no /mentors nem têm o comportamento padrão de mentee no app.
--
-- Regra: todo profile que não tem NENHUMA das duas roles (mentor OU mentee)
-- recebe a role 'mentee' por padrão. Quem já tem qualquer uma das duas (ou
-- ambas) não é tocado. Roles extras (ex.: 'admin') não são afetadas.
-- ============================================================================

DO $$
DECLARE
  mentee_role_id int;
BEGIN
  SELECT id INTO mentee_role_id FROM public.roles WHERE name = 'mentee';

  IF mentee_role_id IS NULL THEN
    RAISE EXCEPTION 'Role "mentee" não encontrada em public.roles';
  END IF;

  INSERT INTO public.user_roles (user_id, role_id)
  SELECT p.id, mentee_role_id
  FROM public.profiles p
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = p.id
      AND r.name IN ('mentor', 'mentee')
  )
  ON CONFLICT DO NOTHING;
END $$;
