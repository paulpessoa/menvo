-- Migration: Fix RLS Recursion e novos campos para Hub Resources
-- Propósito: Resolver erro de recursão e adicionar suporte a localização e data/hora no Hub

-- 1. Criar função auxiliar para checar admin de forma segura (evita recursão)
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

-- 2. Corrigir políticas de user_roles usando a função
DROP POLICY IF EXISTS "admins_can_manage_any_user_roles" ON public.user_roles;
CREATE POLICY "admins_can_manage_any_user_roles" ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- 3. Adicionar novos campos à tabela hub_resources
ALTER TABLE public.hub_resources 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS location_url TEXT,
ADD COLUMN IF NOT EXISTS event_date DATE,
ADD COLUMN IF NOT EXISTS event_time TIME;

-- 4. Atualizar política de storage para que o Admin também possa fazer upload no Hub
-- (Já deve estar coberto pelo catch-all de avatars, mas vamos garantir o path 'hub-images')
CREATE POLICY "Admins can upload hub images" ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'public-assets' AND public.is_admin()
  );
