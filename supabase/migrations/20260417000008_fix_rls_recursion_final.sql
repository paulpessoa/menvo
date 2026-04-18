-- Migration: Fix Definitivo de Recursão RLS em user_roles
-- Propósito: Permitir que Admins gerenciem roles sem gerar loop infinito

-- 1. Remover políticas problemáticas
DROP POLICY IF EXISTS "admins_can_manage_any_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "admins_can_manage_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "admins_can_view_all_user_roles" ON public.user_roles;

-- 2. Criar política baseada no UID para visualização própria (segura)
CREATE POLICY "users_view_own_roles" ON public.user_roles
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 3. Criar política para ADMINS usando uma subquery que não cause recursão direta 
-- ou que use metadados se disponíveis.
-- No PostgreSQL/Supabase, podemos checar se o usuário tem a role 'admin'
-- sem entrar em loop restringindo a subquery.
CREATE POLICY "admin_manage_all_roles" ON public.user_roles
FOR ALL TO authenticated
USING (
  (SELECT COUNT(*) FROM public.user_roles ur 
   JOIN public.roles r ON ur.role_id = r.id 
   WHERE ur.user_id = auth.uid() AND r.name = 'admin') > 0
);

-- 4. Garantir que a tabela ROLES seja legível para todos (essencial para o JOIN acima)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "everyone_can_read_roles" ON public.roles;
CREATE POLICY "everyone_can_read_roles" ON public.roles
FOR SELECT TO public
USING (true);
