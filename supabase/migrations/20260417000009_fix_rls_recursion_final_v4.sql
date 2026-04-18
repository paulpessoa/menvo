-- Migration: Fix Definitivo de Recursão RLS (Versão Staff v4)
-- Propósito: Restaurar acesso Admin sem quebrar dependências

-- 1. Sobrescrever a função is_admin mantendo a mesma assinatura para não quebrar políticas de storage
-- O truque é manter o retorno e o SECURITY DEFINER para ignorar RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.name = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Limpar e recriar políticas da tabela user_roles
-- Aqui removemos a recursão direta
DROP POLICY IF EXISTS "admin_manage_all_roles" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_all" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_read_own" ON public.user_roles;
DROP POLICY IF EXISTS "users_view_own_roles" ON public.user_roles;
DROP POLICY IF EXISTS "admins_can_manage_any_user_roles" ON public.user_roles;

-- Política segura de visualização
CREATE POLICY "user_roles_read_own" ON public.user_roles
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Política para Admin usando a função SECURITY DEFINER (que não gera recursão)
CREATE POLICY "user_roles_admin_manage" ON public.user_roles
FOR ALL TO authenticated
USING (public.is_admin());
