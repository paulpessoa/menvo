
-- 1. Permitir que Super Admins vejam TODOS os membros de qualquer organização
DROP POLICY IF EXISTS "Admins can view all members" ON public.organization_members;
CREATE POLICY "Admins can view all members" 
ON public.organization_members FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);

-- 2. Permitir que membros vejam seus próprios colegas de organização
DROP POLICY IF EXISTS "Members can view their colleagues" ON public.organization_members;
CREATE POLICY "Members can view their colleagues" 
ON public.organization_members FOR SELECT 
TO authenticated 
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid()
  )
);

-- 3. Permitir que o criador da organização gerencie membros (ALL)
DROP POLICY IF EXISTS "Org admins can manage members" ON public.organization_members;
CREATE POLICY "Org admins can manage members" 
ON public.organization_members FOR ALL
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = organization_members.organization_id
    AND user_id = auth.uid()
    AND role IN ('admin', 'moderator')
  )
);
