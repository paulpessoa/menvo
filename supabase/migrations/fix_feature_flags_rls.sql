
-- Limpar políticas antigas
DROP POLICY IF EXISTS "Public read flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Admins can manage flags" ON public.feature_flags;

-- Política de leitura pública
CREATE POLICY "Public read flags" ON public.feature_flags FOR SELECT USING (true);

-- Política para Admin (Baseada no email que você forneceu ou role 'admin')
CREATE POLICY "Admins can manage flags" ON public.feature_flags 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  ) OR auth.jwt() ->> 'email' = 'admin@menvo.com.br'
);

-- Inserir flags padronizadas (camelCase)
INSERT INTO public.feature_flags (name, enabled, description) VALUES 
('waitingListEnabled', false, 'Habilita a lista de espera para novos usuários'),
('feedbackEnabled', true, 'Habilita o sistema de avaliações de mentorias'),
('maintenanceMode', false, 'Ativa o modo de manutenção global'),
('newUserRegistration', true, 'Permite o cadastro de novos usuários'),
('mentorVerification', true, 'Exige aprovação manual para novos mentores'),
('newMentorshipUx', false, 'Ativa a nova interface fluida estilo ADPList')
ON CONFLICT (name) DO UPDATE SET 
  description = EXCLUDED.description;
