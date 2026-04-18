-- Migration: Garantir acesso total do Admin ao Menvo Hub
-- Propósito: Permitir que admins vejam itens pendentes de outros usuários

-- 1. Remover política antiga de Admin se existir
DROP POLICY IF EXISTS "Admins podem gerenciar tudo" ON public.hub_resources;
DROP POLICY IF EXISTS "Admins podem tudo" ON public.hub_resources;

-- 2. Criar política robusta usando a função is_admin() que já criamos
CREATE POLICY "admins_manage_hub_resources" 
ON public.hub_resources FOR ALL 
TO authenticated
USING (public.is_admin());

-- 3. Garantir que a política de visualização pública continue funcionando
DROP POLICY IF EXISTS "Visualização pública de recursos publicados" ON public.hub_resources;
CREATE POLICY "public_view_hub_resources" 
ON public.hub_resources FOR SELECT 
USING (status = 'published' OR public.is_admin());

-- 4. Grant permissões básicas (redundância de segurança)
GRANT ALL ON public.hub_resources TO authenticated;
