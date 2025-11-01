-- Create appointment_feedbacks table
CREATE TABLE IF NOT EXISTS public.appointment_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id INTEGER NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewed_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Avaliação
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    
    -- Anotações privadas (só o autor vê)
    private_notes TEXT,
    
    -- Feedback público (o outro participante vê)
    public_feedback TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Garantir que cada pessoa só pode avaliar uma vez por appointment
    UNIQUE(appointment_id, reviewer_id)
);

-- Indexes para performance
CREATE INDEX idx_appointment_feedbacks_appointment ON public.appointment_feedbacks(appointment_id);
CREATE INDEX idx_appointment_feedbacks_reviewer ON public.appointment_feedbacks(reviewer_id);
CREATE INDEX idx_appointment_feedbacks_reviewed ON public.appointment_feedbacks(reviewed_id);

-- RLS Policies
ALTER TABLE public.appointment_feedbacks ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver feedbacks onde são o autor ou o avaliado
CREATE POLICY "users_can_view_own_feedbacks"
ON public.appointment_feedbacks
FOR SELECT
TO authenticated
USING (
    auth.uid() = reviewer_id OR 
    auth.uid() = reviewed_id
);

-- Usuários podem criar feedbacks onde são participantes do appointment
CREATE POLICY "users_can_create_own_feedbacks"
ON public.appointment_feedbacks
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
        SELECT 1 FROM public.appointments
        WHERE id = appointment_id
        AND (mentor_id = auth.uid() OR mentee_id = auth.uid())
        AND status = 'confirmed'
    )
);

-- Usuários podem atualizar apenas seus próprios feedbacks
CREATE POLICY "users_can_update_own_feedbacks"
ON public.appointment_feedbacks
FOR UPDATE
TO authenticated
USING (auth.uid() = reviewer_id)
WITH CHECK (auth.uid() = reviewer_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_appointment_feedbacks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_appointment_feedbacks_updated_at_trigger
    BEFORE UPDATE ON public.appointment_feedbacks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_appointment_feedbacks_updated_at();

-- Comentários
COMMENT ON TABLE public.appointment_feedbacks IS 'Feedbacks e avaliações de sessões de mentoria';
COMMENT ON COLUMN public.appointment_feedbacks.private_notes IS 'Anotações privadas do usuário (não compartilhadas)';
COMMENT ON COLUMN public.appointment_feedbacks.public_feedback IS 'Feedback compartilhado com o outro participante';
