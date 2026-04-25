-- Adiciona políticas de RLS para tabelas de logs administrativos
-- Resolve avisos do Security Advisor (RLS enabled but no policies exist)

BEGIN;

-- 1. admin_actions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_actions' AND policyname = 'Admins can view admin actions') THEN
        CREATE POLICY "Admins can view admin actions" ON public.admin_actions
        FOR SELECT TO authenticated USING (
            EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name = 'admin')
        );
    END IF;
END $$;

-- 2. feature_flag_audit_logs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feature_flag_audit_logs' AND policyname = 'Admins can view feature flag logs') THEN
        CREATE POLICY "Admins can view feature flag logs" ON public.feature_flag_audit_logs
        FOR SELECT TO authenticated USING (
            EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name = 'admin')
        );
    END IF;
END $$;

-- 3. verification_logs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'verification_logs' AND policyname = 'Admins can view verification logs') THEN
        CREATE POLICY "Admins can view verification logs" ON public.verification_logs
        FOR SELECT TO authenticated USING (
            EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name = 'admin')
        );
    END IF;
END $$;

COMMIT;
