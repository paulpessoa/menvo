-- Create user_reports table
CREATE TABLE user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_email text, -- Can be an email or a name if they don't know the exact user ID
  category text NOT NULL,
  description text NOT NULL,
  evidence_paths text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- Reporter can insert
CREATE POLICY "Users can insert their own reports" 
  ON user_reports FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = reporter_id);

-- Reporter can view their own reports
CREATE POLICY "Users can view their own reports" 
  ON user_reports FOR SELECT 
  TO authenticated 
  USING (auth.uid() = reporter_id);

-- Admin can do everything (Assuming public.is_admin() exists as per Menvo architecture)
CREATE POLICY "Admins can view all reports" 
  ON user_reports FOR SELECT 
  TO authenticated 
  USING (public.is_admin());

CREATE POLICY "Admins can update reports" 
  ON user_reports FOR UPDATE 
  TO authenticated 
  USING (public.is_admin());

-- Create a secure storage bucket for evidence
INSERT INTO storage.buckets (id, name, public) 
VALUES ('reports_evidence', 'reports_evidence', false)
ON CONFLICT (id) DO NOTHING;

-- Evidence Bucket RLS
-- Users can upload evidence to their own folder
CREATE POLICY "Users can upload evidence"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'reports_evidence' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read their own evidence
CREATE POLICY "Users can read own evidence"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'reports_evidence' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can read all evidence
CREATE POLICY "Admins can read all evidence"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'reports_evidence' AND
    public.is_admin()
  );
