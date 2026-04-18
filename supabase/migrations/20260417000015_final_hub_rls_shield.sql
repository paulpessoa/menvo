-- Migration: Blindagem Final de RLS para o Hub
-- Propósito: Garantir que qualquer usuário logado possa sugerir e ver seus próprios itens

-- 1. Limpar políticas anteriores
DROP POLICY IF EXISTS "allow_users_select_own_suggestions" ON public.hub_resources;
DROP POLICY IF EXISTS "allow_authenticated_insert" ON public.hub_resources;
DROP POLICY IF EXISTS "allow_public_select_published" ON public.hub_resources;
DROP POLICY IF EXISTS "allow_admin_all" ON public.hub_resources;

-- 2. Inserção: Qualquer autenticado pode inserir seu próprio registro
CREATE POLICY "hub_insert_own" ON public.hub_resources
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Seleção: O usuário vê o que ele criou OU o que está publicado OU se for Admin
CREATE POLICY "hub_select_complex" ON public.hub_resources
FOR SELECT TO public
USING (
    (auth.uid() = user_id) OR 
    (status = 'published') OR 
    (public.is_admin())
);

-- 4. Modificação: Apenas o dono (se for pendente) ou o Admin
CREATE POLICY "hub_update_own_or_admin" ON public.hub_resources
FOR UPDATE TO authenticated
USING (
    (auth.uid() = user_id AND status = 'pending') OR 
    (public.is_admin())
)
WITH CHECK (
    (auth.uid() = user_id AND status = 'pending') OR 
    (public.is_admin())
);

-- 5. Delete: Apenas Admin
CREATE POLICY "hub_delete_admin" ON public.hub_resources
FOR DELETE TO authenticated
USING (public.is_admin());
