
-- 1. Corrigir google_calendar_tokens (Adicionar política)
-- O usuário só pode ver e mexer nos seus próprios tokens
DROP POLICY IF EXISTS "Users can manage their own calendar tokens" ON public.google_calendar_tokens;
CREATE POLICY "Users can manage their own calendar tokens" 
ON public.google_calendar_tokens 
FOR ALL 
USING (auth.uid() = user_id);

-- 2. Corrigir feature_flag_audit_logs (Ativar RLS e adicionar política)
ALTER TABLE public.feature_flag_audit_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins (Super Admins) podem ver os logs de auditoria
CREATE POLICY "Admins can view audit logs" 
ON public.feature_flag_audit_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);
