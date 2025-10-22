-- Adicionar campo action_token para confirmação/cancelamento por email

ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS action_token TEXT UNIQUE;

-- Criar índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_appointments_action_token 
ON public.appointments(action_token);

-- Comentário
COMMENT ON COLUMN public.appointments.action_token IS 
'Token único para ações de confirmação/cancelamento via email';
