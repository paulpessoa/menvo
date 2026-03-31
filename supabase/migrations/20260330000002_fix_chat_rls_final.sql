-- Fix Chat RLS Policies - Definitivo
-- Remove qualquer resquício de policies antigas e define um modelo robusto

-- ============================================
-- 1. LIMPEZA TOTAL
-- ============================================

-- Conversations
DROP POLICY IF EXISTS "conversations_select" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update" ON public.conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;

-- Messages
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_update" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.messages;

-- ============================================
-- 2. NOVAS POLICIES PARA CONVERSATIONS
-- ============================================

-- SELECT: Participantes podem ver a conversa
CREATE POLICY "chat_conv_select" ON public.conversations
FOR SELECT TO authenticated
USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);

-- INSERT: Usuário autenticado pode criar se for um dos participantes
CREATE POLICY "chat_conv_insert" ON public.conversations
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = mentor_id OR auth.uid() = mentee_id);

-- UPDATE: Participantes podem atualizar (ex: last_message_at)
CREATE POLICY "chat_conv_update" ON public.conversations
FOR UPDATE TO authenticated
USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);

-- ============================================
-- 3. NOVAS POLICIES PARA MESSAGES
-- ============================================

-- SELECT: Ver mensagens se for participante da conversa pai
CREATE POLICY "chat_msg_select" ON public.messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.mentor_id = auth.uid() OR c.mentee_id = auth.uid())
  )
);

-- INSERT: Enviar mensagem se for o remetente E participante da conversa
CREATE POLICY "chat_msg_insert" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id 
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.mentor_id = auth.uid() OR c.mentee_id = auth.uid())
  )
);

-- UPDATE: Marcar como lida se for participante da conversa
CREATE POLICY "chat_msg_update" ON public.messages
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.mentor_id = auth.uid() OR c.mentee_id = auth.uid())
  )
);

-- ============================================
-- 4. PERMISSÕES E RLS
-- ============================================

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT SELECT ON public.conversations TO anon; -- Opcional, dependendo da UI
GRANT SELECT ON public.messages TO anon; -- Opcional

-- Garantir que o service_role sempre tenha acesso total
GRANT ALL ON public.conversations TO service_role;
GRANT ALL ON public.messages TO service_role;
