-- =================================================================
-- ADD VERIFICATION LOGS TABLE
-- For audit trail of mentor verification actions
-- =================================================================

-- Create verification logs table for audit purposes
CREATE TABLE public.verification_logs (
  id SERIAL PRIMARY KEY,
  mentor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('verified', 'unverified')),
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  notes TEXT
);

-- Create indexes for performance
CREATE INDEX idx_verification_logs_mentor_id ON public.verification_logs(mentor_id);
CREATE INDEX idx_verification_logs_admin_id ON public.verification_logs(admin_id);
CREATE INDEX idx_verification_logs_timestamp ON public.verification_logs(timestamp);

-- Enable RLS
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view all logs
CREATE POLICY "Admins can view all verification logs" ON public.verification_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Create policy for admins to insert logs
CREATE POLICY "Admins can insert verification logs" ON public.verification_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );