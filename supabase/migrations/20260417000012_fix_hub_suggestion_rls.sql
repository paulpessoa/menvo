-- Migration: Fix Definitivo de Acesso e Sugestão
-- Propósito: Garantir que sugestões funcionem e Admin seja estável

-- 1. Resetar políticas da tabela hub_resources
DROP POLICY IF EXISTS "admins_manage_hub_resources" ON public.hub_resources;
DROP POLICY IF EXISTS "public_view_hub_resources" ON public.hub_resources;
DROP POLICY IF EXISTS "Usuários logados podem sugerir recursos" ON public.hub_resources;
DROP POLICY IF EXISTS "Visualização pública de recursos publicados" ON public.hub_resources;

-- Política A: Inserção (Sugestão) - Aberta para qualquer autenticado
CREATE POLICY "hub_insert_suggestion" ON public.hub_resources
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Política B: Visualização Pública
CREATE POLICY "hub_select_public" ON public.hub_resources
FOR SELECT TO public
USING (status = 'published');

-- Política C: Admin total
CREATE POLICY "hub_admin_all" ON public.hub_resources
FOR ALL TO authenticated
USING (public.is_admin());

-- 2. Garantir que a leitura de ROLES seja infalível para o usuário logado
-- Isso evita que o menu suma por falha de leitura de permissões
DROP POLICY IF EXISTS "user_roles_read_own" ON public.user_roles;
CREATE POLICY "user_roles_read_own_v2" ON public.user_roles
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 3. Garantir que a tabela ROLES seja legível (sem RLS para leitura pública de nomes)
ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.roles TO public;
