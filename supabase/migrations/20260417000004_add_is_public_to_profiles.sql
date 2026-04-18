-- Migration: Adicionar controle de visibilidade pública ao perfil
-- Propósito: Permitir que usuários (especialmente mentees) escolham aparecer ou não no Mural da Comunidade

-- 1. Adicionar coluna is_public se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_public') THEN
        ALTER TABLE public.profiles ADD COLUMN is_public BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 2. Atualizar comentários para documentação
COMMENT ON COLUMN public.profiles.is_public IS 'Controla se o perfil é exibido publicamente no Mural da Comunidade (opt-in)';

-- 3. Index para otimizar a busca pública
CREATE INDEX IF NOT EXISTS idx_profiles_is_public ON public.profiles(is_public) WHERE is_public = true;
