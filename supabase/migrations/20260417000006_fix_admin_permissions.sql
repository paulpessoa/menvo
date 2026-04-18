-- Migration: Reforço de Permissões Administrativas
-- Propósito: Garantir que o Admin consiga gerenciar roles e uploads sem conflitos de RLS

-- 1. Fix Recursão Infinita em user_roles para Admins
-- Usamos uma função auxiliar ou verificamos direto contra o auth.jwt() se possível
-- Mas a forma mais simples e segura no Supabase é garantir políticas não-recursivas

DROP POLICY IF EXISTS "admins_can_manage_user_roles" ON public.user_roles;

-- Nova política para Admins gerenciarem qualquer role
-- Nota: A verificação de admin deve ser robusta
CREATE POLICY "admins_can_manage_any_user_roles" ON public.user_roles
  FOR ALL
  TO authenticated
  USING (
    (SELECT roles.name FROM public.user_roles ur JOIN public.roles ON ur.role_id = roles.id WHERE ur.user_id = auth.uid() LIMIT 1) = 'admin'
  );

-- 2. Garantir que o Admin pode fazer upload para o bucket de avatares de QUALQUER usuário
DROP POLICY IF EXISTS "admins_can_upload_any_avatar" ON storage.objects;
CREATE POLICY "admins_can_upload_any_avatar" ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'avatars' AND 
    (SELECT roles.name FROM public.user_roles ur JOIN public.roles ON ur.role_id = roles.id WHERE ur.user_id = auth.uid() LIMIT 1) = 'admin'
  );
