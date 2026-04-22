-- =================================================================
-- ADD AI TRACKING TABLES
-- Track user searches and missing mentor demands
-- =================================================================

CREATE TABLE IF NOT EXISTS public.ai_missing_demands (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  query_text TEXT NOT NULL,
  suggested_topics TEXT[],
  matched_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.ai_missing_demands ENABLE ROW LEVEL SECURITY;

-- Admins can see all demands
CREATE POLICY "Admins can view AI demands" ON public.ai_missing_demands
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    JOIN public.roles r ON ur.role_id = r.id 
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  ));

-- Authenticated users can insert their own queries
CREATE POLICY "Users can log their AI queries" ON public.ai_missing_demands
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update updated_at trigger for profiles if we need it later
-- (Profiles already has updated_at logic from previous migrations)
