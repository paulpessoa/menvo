-- Migration: Fix de SELECT para Sugestão no Hub
-- Propósito: Permitir que o usuário leia o próprio registro inserido, resolvendo o erro 42501 (RLS violation) ao retornar dados

-- 1. Criar política que permite ao usuário ver seus próprios recursos (essencial para o .select() após .insert())
DROP POLICY IF EXISTS "allow_users_select_own_suggestions" ON public.hub_resources;
CREATE POLICY "allow_users_select_own_suggestions" 
ON public.hub_resources FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- 2. Garantir que a política de inserção esteja correta e vinculada ao user_id
DROP POLICY IF EXISTS "allow_authenticated_insert" ON public.hub_resources;
CREATE POLICY "allow_authenticated_insert" 
ON public.hub_resources FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 3. Comentário explicativo para auditorias futuras
COMMENT ON POLICY "allow_users_select_own_suggestions" ON public.hub_resources IS 'Permite que o criador veja sua própria sugestão, necessário para o retorno da API no momento da criação.';
