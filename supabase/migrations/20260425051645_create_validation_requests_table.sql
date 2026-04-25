-- Cria a tabela para gerenciar solicitações de validação de papéis
CREATE TABLE IF NOT EXISTS public.validation_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilita RLS
ALTER TABLE public.validation_requests ENABLE ROW LEVEL SECURITY;

-- Permite que usuários vejam suas próprias solicitações
CREATE POLICY "Users can view own validation requests" 
ON public.validation_requests FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Permite que usuários insiram suas solicitações
CREATE POLICY "Users can insert own validation requests" 
ON public.validation_requests FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Permite que admins façam tudo
CREATE POLICY "Admins can manage all validation requests" 
ON public.validation_requests FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
);
