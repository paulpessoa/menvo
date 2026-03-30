-- Fix Mentors List Public Access
-- Permite que usuários anônimos e autenticados visualizem as atribuições de roles
-- Isso é necessário para que a mentors_view (que faz join com user_roles) funcione para o público

-- 1. Adicionar política de SELECT para a tabela roles (garantir que todos podem ler)
-- Já existe "everyone_can_read_roles_simple", mas vamos reforçar se necessário
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'roles' 
        AND policyname = 'public_read_roles'
    ) THEN
        CREATE POLICY "public_read_roles" ON public.roles
        FOR SELECT TO anon, authenticated
        USING (true);
    END IF;
END $$;

-- 2. Adicionar política de SELECT para a tabela user_roles
-- Permite que todos vejam quais usuários possuem quais roles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_roles' 
        AND policyname = 'public_read_user_roles'
    ) THEN
        CREATE POLICY "public_read_user_roles" ON public.user_roles
        FOR SELECT TO anon, authenticated
        USING (true);
    END IF;
END $$;

-- 3. Garantir que a mentors_view tem permissões de select
GRANT SELECT ON public.mentors_view TO anon, authenticated;
GRANT SELECT ON public.roles TO anon, authenticated;
GRANT SELECT ON public.user_roles TO anon, authenticated;

-- 4. Comentário explicativo
COMMENT ON POLICY "public_read_user_roles" ON public.user_roles IS 'Permite acesso público de leitura para possibilitar o join na mentors_view';
