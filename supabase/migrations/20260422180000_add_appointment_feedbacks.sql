-- 📝 DESIGN DE TABELA: Feedback de Mentoria
-- Propósito: Avaliação de sessões específicas entre mentor e mentee.

CREATE TABLE IF NOT EXISTS public.appointment_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES public.profiles(id),
    mentee_id UUID NOT NULL REFERENCES public.profiles(id),
    
    -- Notas (1-5)
    technical_rating INTEGER CHECK (technical_rating >= 1 AND technical_rating <= 5),
    soft_skills_rating INTEGER CHECK (soft_skills_rating >= 1 AND soft_skills_rating <= 5),
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    
    -- Comentários
    comment TEXT,
    private_note TEXT, -- Nota que apenas o mentor/admin vê
    
    -- Flags de Moderação
    is_public BOOLEAN DEFAULT true,
    is_reviewed BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_appointment_feedbacks_mentor ON public.appointment_feedbacks(mentor_id);
CREATE INDEX IF NOT EXISTS idx_appointment_feedbacks_appointment ON public.appointment_feedbacks(appointment_id);

-- RLS (Row Level Security)
ALTER TABLE public.appointment_feedbacks ENABLE ROW LEVEL SECURITY;

-- Política: Mentees podem inserir seu próprio feedback
CREATE POLICY "Mentees can insert feedback for their sessions" 
ON public.appointment_feedbacks FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = mentee_id);

-- Política: Todos podem ver feedbacks públicos
CREATE POLICY "Anyone can view public feedbacks" 
ON public.appointment_feedbacks FOR SELECT 
USING (is_public = true);

-- Política: Mentores podem ver todos os feedbacks recebidos (incluindo privados)
CREATE POLICY "Mentors can view their own feedbacks" 
ON public.appointment_feedbacks FOR SELECT 
TO authenticated 
USING (auth.uid() = mentor_id);
