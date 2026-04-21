-- =================================================================
-- ENRICH APPOINTMENTS AND PROFILES
-- Add missing columns used by the application services
-- =================================================================

-- 1. Enrich appointments table
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS mentor_response TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS requested_date DATE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS requested_start_time TIME;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS requested_end_time TIME;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Sao_Paulo';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS meeting_link TEXT;

-- 2. Create admin_actions table (if missing)
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id SERIAL PRIMARY KEY,
  admin_id UUID REFERENCES public.profiles(id),
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Create mentor_verification table (if missing)
CREATE TABLE IF NOT EXISTS public.mentor_verification (
  id SERIAL PRIMARY KEY,
  mentor_id UUID REFERENCES public.profiles(id) NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewer_notes TEXT,
  rejection_reason TEXT,
  documents_url TEXT[]
);

-- Enable RLS on new tables
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_verification ENABLE ROW LEVEL SECURITY;

-- Basic policies for admin_actions
CREATE POLICY "Admins can view all actions" ON public.admin_actions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    JOIN public.roles r ON ur.role_id = r.id 
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  ));

CREATE POLICY "Admins can insert actions" ON public.admin_actions
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    JOIN public.roles r ON ur.role_id = r.id 
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  ));

-- Basic policies for mentor_verification
CREATE POLICY "Users can view own verification" ON public.mentor_verification
  FOR SELECT USING (mentor_id = auth.uid());

CREATE POLICY "Admins can view all verifications" ON public.mentor_verification
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    JOIN public.roles r ON ur.role_id = r.id 
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  ));
