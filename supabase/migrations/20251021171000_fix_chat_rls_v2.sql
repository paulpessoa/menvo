-- Fix Chat RLS Policies V2
-- Remove policies restritivas e cria policies permissivas

-- Drop ALL existing INSERT policies for conversations
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Mentors can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "System can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;

-- Criar policy PERMISSIVA para INSERT em conversations
CREATE POLICY "Allow authenticated to create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Drop e recriar policy de INSERT em messages
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.messages;

CREATE POLICY "Allow authenticated to send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

-- Log para confirmar
DO $$
BEGIN
  RAISE NOTICE 'Chat RLS policies updated successfully';
END $$;
