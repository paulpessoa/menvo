-- Ensure Complete Chat Setup
-- Garante que todas as tabelas, policies e Realtime estão configurados

-- 1. Garantir que as tabelas existem (já devem existir da migration anterior)
-- Apenas verificando se precisam ser recriadas

-- 2. Garantir que RLS está habilitado
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 3. Drop ALL existing policies para recriar do zero
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Mentors can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow authenticated to create conversations" ON public.conversations;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;

-- 4. Criar policies corretas para CONVERSATIONS

-- SELECT: Ver conversas onde é participante
CREATE POLICY "Users can view their own conversations"
ON public.conversations
FOR SELECT
USING (
  auth.uid() = mentor_id OR auth.uid() = mentee_id
);

-- INSERT: Criar conversa onde é o mentee
CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (
  auth.uid() = mentee_id
);

-- UPDATE: Atualizar conversas onde é participante (para last_message_at)
CREATE POLICY "Users can update their own conversations"
ON public.conversations
FOR UPDATE
USING (
  auth.uid() = mentor_id OR auth.uid() = mentee_id
);

-- 5. Criar policies corretas para MESSAGES

-- SELECT: Ver mensagens de conversas onde é participante
CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id
    AND (mentor_id = auth.uid() OR mentee_id = auth.uid())
  )
);

-- INSERT: Enviar mensagens em conversas onde é participante
CREATE POLICY "Users can send messages in their conversations"
ON public.messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id
    AND (mentor_id = auth.uid() OR mentee_id = auth.uid())
  )
);

-- UPDATE: Marcar mensagens como lidas
CREATE POLICY "Users can update messages in their conversations"
ON public.messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id
    AND (mentor_id = auth.uid() OR mentee_id = auth.uid())
  )
);

-- 6. Habilitar Realtime para as tabelas (apenas se ainda não estiverem)
DO $$
BEGIN
  -- Add conversations if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
  
  -- Add messages if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- 7. Garantir que a coluna chat_enabled existe em profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS chat_enabled BOOLEAN DEFAULT false;

-- 8. Criar índices para performance (se não existirem)
CREATE INDEX IF NOT EXISTS idx_conversations_mentor_mentee 
ON public.conversations(mentor_id, mentee_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON public.messages(conversation_id, created_at DESC);

-- Comentários
COMMENT ON TABLE public.conversations IS 'Chat conversations between mentors and mentees with Realtime enabled';
COMMENT ON TABLE public.messages IS 'Chat messages with Realtime enabled';
