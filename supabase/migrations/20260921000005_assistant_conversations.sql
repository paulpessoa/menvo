-- Tabela de histórico de conversas com o Assistente
CREATE TABLE IF NOT EXISTS public.assistant_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Ativar Row Level Security (RLS)
ALTER TABLE public.assistant_conversations ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS: o próprio usuário pode visualizar e inserir suas conversas
CREATE POLICY "Users can insert their own conversations" 
ON public.assistant_conversations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own conversations"
ON public.assistant_conversations
FOR SELECT
USING (auth.uid() = user_id);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_user_id ON public.assistant_conversations(user_id);
