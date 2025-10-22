-- Fix Profiles Policies - Permitir acesso aos perfis de mentores
-- Remove todas as policies conflitantes e cria policies claras

-- 1. Remover todas as policies existentes da tabela profiles
DROP POLICY IF EXISTS "users_can_view_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "public_can_view_verified_mentors" ON public.profiles;
DROP POLICY IF EXISTS "public_can_view_verified_mentors_profiles" ON public.profiles;
DROP POLICY IF EXISTS "anon_can_view_verified_mentors" ON public.profiles;
DROP POLICY IF EXISTS "admins_can_view_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_can_update_any_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_manage_own_profiles_only" ON public.profiles;
DROP POLICY IF EXISTS "public_can_view_mentors_view" ON public.profiles;

-- 2. Criar policies claras e sem conflitos

-- SELECT: Usuários autenticados podem ver qualquer perfil
CREATE POLICY "authenticated_can_view_all_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- SELECT: Usuários anônimos podem ver perfis verificados
CREATE POLICY "anon_can_view_verified_profiles"
ON public.profiles
FOR SELECT
TO anon
USING (verified = true);

-- INSERT: Usuários podem criar apenas seu próprio perfil
CREATE POLICY "users_can_insert_own_profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- UPDATE: Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "users_can_update_own_profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- DELETE: Usuários podem deletar apenas seu próprio perfil
CREATE POLICY "users_can_delete_own_profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- 3. Garantir que RLS está habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Comentário explicativo
COMMENT ON TABLE public.profiles IS 'User profiles with RLS: authenticated users can view all profiles, but can only modify their own';
