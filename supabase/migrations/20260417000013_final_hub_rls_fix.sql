-- Migration: Fix Definitivo RLS Hub Suggestions
-- Propósito: Garantir que qualquer usuário logado consiga enviar sugestões sem erro 42501

-- 1. Limpar TODAS as políticas da tabela para evitar conflitos de versões anteriores
DROP POLICY IF EXISTS "hub_insert_suggestion" ON public.hub_resources;
DROP POLICY IF EXISTS "hub_insert_suggestion_v2" ON public.hub_resources;
DROP POLICY IF EXISTS "hub_select_public" ON public.hub_resources;
DROP POLICY IF EXISTS "hub_admin_all" ON public.hub_resources;
DROP POLICY IF EXISTS "admins_manage_hub_resources" ON public.hub_resources;
DROP POLICY IF EXISTS "public_view_hub_resources" ON public.hub_resources;
DROP POLICY IF EXISTS "Usuários logados podem sugerir recursos" ON public.hub_resources;
DROP POLICY IF EXISTS "Visualização pública de recursos publicados" ON public.hub_resources;

-- 2. Habilitar RLS (garantir que está ativo)
ALTER TABLE public.hub_resources ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICA DE INSERÇÃO (Sugestão)
-- Permite que qualquer usuário autenticado insira uma linha
-- O banco cuidará do user_id via default ou o app enviará
CREATE POLICY "allow_authenticated_insert" 
ON public.hub_resources FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 4. POLÍTICA DE SELEÇÃO (Pública)
-- Qualquer um (até deslogado) vê o que está publicado
CREATE POLICY "allow_public_select_published" 
ON public.hub_resources FOR SELECT 
TO public
USING (status = 'published');

-- 5. POLÍTICA DE ADMIN (Total)
-- Admins podem ver pendentes, editar e deletar tudo
CREATE POLICY "allow_admin_all" 
ON public.hub_resources FOR ALL 
TO authenticated
USING (public.is_admin());

-- 6. Garantir permissões de acesso
GRANT ALL ON public.hub_resources TO authenticated;
GRANT SELECT ON public.hub_resources TO anon;
