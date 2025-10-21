-- Fix Chat RLS Policies
-- Corrige as policies de INSERT para permitir criação de conversas

-- Primeiro, garantir que a coluna chat_enabled existe
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS chat_enabled BOOLEAN DEFAULT false;

-- Drop ALL existing INSERT policies
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Mentors can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "System can create conversations" ON public.conversations;

-- Criar policy MUITO permissiva para INSERT
-- Permite que qualquer usuário autenticado crie conversas
CREATE POLICY "Authenticated users can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Verificar policy de INSERT em messages
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;

CREATE POLICY "Authenticated users can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
);

-- Comentários para documentação
COMMENT ON POLICY "Authenticated users can create conversations" ON public.conversations IS 
'Permite que qualquer usuário autenticado crie conversas (policy permissiva para MVP)';

COMMENT ON POLICY "Authenticated users can send messages" ON public.messages IS 
'Permite que usuários autenticados enviem mensagens';
