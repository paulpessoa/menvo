-- Fix Chat Policies - Limpar e criar policies corretas
-- Remove todas as policies conflitantes e cria policies claras

-- ============================================
-- 1. REMOVER TODAS AS POLICIES EXISTENTES
-- ============================================

-- Conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_select_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON public.conversations;

-- Messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;

-- ============================================
-- 2. CRIAR POLICIES CORRETAS PARA CONVERSATIONS
-- ============================================

-- SELECT: Ver conversas onde é participante (mentor ou mentee)
CREATE POLICY "conversations_select"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  auth.uid() = mentor_id OR auth.uid() = mentee_id
);

-- INSERT: Qualquer usuário autenticado pode criar conversa
-- (validação de mentor/mentee é feita na aplicação)
CREATE POLICY "conversations_insert"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = mentee_id OR auth.uid() = mentor_id
);

-- UPDATE: Atualizar conversas onde é participante
-- (usado para atualizar last_message_at)
CREATE POLICY "conversations_update"
ON public.conversations
FOR UPDATE
TO authenticated
USING (
  auth.uid() = mentor_id OR auth.uid() = mentee_id
)
WITH CHECK (
  auth.uid() = mentor_id OR auth.uid() = mentee_id
);

-- ============================================
-- 3. CRIAR POLICIES CORRETAS PARA MESSAGES
-- ============================================

-- SELECT: Ver mensagens de conversas onde é participante
CREATE POLICY "messages_select"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id
    AND (mentor_id = auth.uid() OR mentee_id = auth.uid())
  )
);

-- INSERT: Enviar mensagens em conversas onde é participante
CREATE POLICY "messages_insert"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id
    AND (mentor_id = auth.uid() OR mentee_id = auth.uid())
  )
);

-- UPDATE: Marcar mensagens como lidas em conversas onde é participante
CREATE POLICY "messages_update"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id
    AND (mentor_id = auth.uid() OR mentee_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id
    AND (mentor_id = auth.uid() OR mentee_id = auth.uid())
  )
);

-- ============================================
-- 4. GARANTIR QUE RLS ESTÁ HABILITADO
-- ============================================

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. COMENTÁRIOS EXPLICATIVOS
-- ============================================

COMMENT ON TABLE public.conversations IS 'Chat conversations with RLS: users can only access conversations where they are mentor or mentee';
COMMENT ON TABLE public.messages IS 'Chat messages with RLS: users can only access messages from their conversations';
