
-- 1. Adicionar papel 'moderator' se não existir na constraint
-- Nota: PostgreSQL não permite mudar a constraint CHECK facilmente sem dropar.
ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_role_check;
ALTER TABLE public.organization_members ADD CONSTRAINT organization_members_role_check 
CHECK (role = ANY (ARRAY['admin'::text, 'moderator'::text, 'mentor'::text, 'mentee'::text]));

-- 2. Garantir que a tabela de logs de atividade existe
CREATE TABLE IF NOT EXISTS public.organization_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL, -- 'member_joined', 'member_left', 'role_changed', 'invite_sent'
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ativar RLS nos logs
ALTER TABLE public.organization_activity_log ENABLE ROW LEVEL SECURITY;

-- Super Admin vê todos os logs, Admin da Org vê apenas os da sua org
CREATE POLICY "Admins can view their org logs" ON public.organization_activity_log
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = organization_activity_log.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin', 'moderator')
    ) OR (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    )
);
