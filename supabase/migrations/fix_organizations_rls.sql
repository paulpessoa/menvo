
-- 1. Permitir que qualquer usuário autenticado veja as organizações (necessário para a busca e detalhes)
DROP POLICY IF EXISTS "Public organizations view" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can view organizations" ON public.organizations;
CREATE POLICY "Authenticated users can view organizations" 
ON public.organizations FOR SELECT 
TO authenticated 
USING (true);

-- 2. Garantir que Super Admin possa fazer TUDO
DROP POLICY IF EXISTS "Admins can do everything on organizations" ON public.organizations;
CREATE POLICY "Admins can do everything on organizations" 
ON public.organizations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);
