-- Migration: Adicionar campos de verificação à tabela profiles
-- Propósito: Permitir que o admin deixe notas de feedback para o usuário

-- 1. Adicionar coluna verification_notes se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='verification_notes') THEN
        ALTER TABLE public.profiles ADD COLUMN verification_notes TEXT;
    END IF;
END $$;

-- 2. Garantir que a coluna verification_status existe (usada no sistema de verificação)
-- Se não existir, adicionamos como text por padrão ou conforme o enum existente
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='verification_status') THEN
        ALTER TABLE public.profiles ADD COLUMN verification_status TEXT DEFAULT 'pending';
    END IF;
END $$;

-- Comentário para documentação
COMMENT ON COLUMN public.profiles.verification_notes IS 'Notas de feedback do administrador sobre o status de verificação do perfil';
COMMENT ON COLUMN public.profiles.verification_status IS 'Status atual de verificação do perfil (pending, approved, rejected)';
