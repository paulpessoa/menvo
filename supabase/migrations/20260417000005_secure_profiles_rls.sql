-- Migration: Reforço de Segurança (RLS) na tabela Profiles
-- Propósito: Garantir que a privacidade do usuário seja respeitada e apenas dados autorizados sejam expostos

-- 1. Remover policies antigas permissivas
DROP POLICY IF EXISTS "authenticated_can_view_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "anon_can_view_verified_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_can_view_all_profiles" ON public.profiles;

-- 2. Criar Novas Policies de SELECT Blindadas

-- Regra A: O próprio usuário sempre pode ver seu perfil completo
CREATE POLICY "users_view_own_profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Regra B: Admins podem ver tudo (usando a tabela user_roles)
CREATE POLICY "admins_view_all_profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        JOIN roles ON user_roles.role_id = roles.id 
        WHERE user_roles.user_id = auth.uid() AND roles.name = 'admin'
    )
);

-- Regra C: Mentores Verificados e Perfis marcados como Públicos são visíveis para todos
-- Isso garante o funcionamento do Mural da Comunidade e Listagem de Mentores
CREATE POLICY "public_view_authorized_profiles"
ON public.profiles FOR SELECT
TO public
USING (
    verified = true OR is_public = true
);

-- 3. Garantir que as políticas de modificação (UPDATE/INSERT) continuem seguras
-- Elas já estão vinculadas ao auth.uid() = id na migração anterior.

-- 4. Comentário de auditoria
COMMENT ON TABLE public.profiles IS 'Profiles protegidos por RLS: respeita o flag is_public e verificação de mentor.';
