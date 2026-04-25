-- Melhora a tabela de feedbacks com suporte a moderação administrativa
-- E permite que o sistema tenha um fluxo de aprovação antes da exibição pública

BEGIN;

-- 1. Adicionar colunas de status e moderação
ALTER TABLE public.appointment_feedbacks 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2. Atualizar RLS para permitir que admins gerenciem os feedbacks
DROP POLICY IF EXISTS "Admins can manage all feedbacks" ON public.appointment_feedbacks;
CREATE POLICY "Admins can manage all feedbacks" 
ON public.appointment_feedbacks FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
);

-- 3. Permitir que o revisor (mentee) edite seu feedback se não estiver aprovado
DROP POLICY IF EXISTS "Users can update their own pending/rejected feedbacks" ON public.appointment_feedbacks;
CREATE POLICY "Users can update their own pending/rejected feedbacks" 
ON public.appointment_feedbacks FOR UPDATE
TO authenticated
USING (
    reviewer_id = auth.uid() 
    AND (status = 'pending' OR status = 'rejected')
)
WITH CHECK (
    reviewer_id = auth.uid() 
    AND (status = 'pending' OR status = 'rejected')
);

-- 4. Garantir que apenas aprovados sejam vistos publicamente (View ou Query)
-- Criaremos uma política específica para isso ou trataremos na query da API.

COMMIT;
