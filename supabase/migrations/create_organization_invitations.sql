
CREATE TABLE IF NOT EXISTS public.organization_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    token TEXT UNIQUE NOT NULL,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    UNIQUE(organization_id, email)
);

ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- Qualquer um com o link/token do convite pode acessá-lo (necessário para a página de aceite)
CREATE POLICY "Public can view their invitations by token" ON public.organization_invitations FOR SELECT USING (true);

-- Apenas admins da organização podem gerenciar (criar, deletar) os convites da sua org
CREATE POLICY "Org admins can manage invitations" ON public.organization_invitations FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = organization_invitations.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
        AND om.status = 'active'
    )
);
