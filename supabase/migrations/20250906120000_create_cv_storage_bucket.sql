-- Create CV storage bucket and policies

-- 1. Create cvs bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('cvs', 'cvs', true, 5242880, '{"application/pdf"}')
ON CONFLICT (id) DO NOTHING;

-- 2. Add storage policies for cvs bucket

-- Policy: Users can upload their own CV
CREATE POLICY "users_can_upload_own_cv" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'cvs' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can update their own CV
CREATE POLICY "users_can_update_own_cv" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'cvs' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own CV
CREATE POLICY "users_can_delete_own_cv" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'cvs' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Public can view CVs (for mentors to access)
CREATE POLICY "public_can_view_cvs" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'cvs');

-- 3. Add metadata table for CV analysis (future use)
CREATE TABLE IF NOT EXISTS cv_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- Analysis fields (to be populated by future CV analysis service)
  analysis_status TEXT DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed')),
  analysis_date TIMESTAMPTZ,
  
  -- Extracted information (to be populated by analysis)
  extracted_skills TEXT[],
  extracted_experience JSONB,
  extracted_education JSONB,
  extracted_languages TEXT[],
  extracted_certifications JSONB,
  
  -- Confidence scores for extracted data
  extraction_confidence JSONB,
  
  -- Raw analysis results for debugging
  raw_analysis_result JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for cv_metadata
ALTER TABLE cv_metadata ENABLE ROW LEVEL SECURITY;

-- Users can only access their own CV metadata
CREATE POLICY "users_own_cv_metadata" ON cv_metadata
  FOR ALL USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS cv_metadata_user_id_idx ON cv_metadata(user_id);
CREATE INDEX IF NOT EXISTS cv_metadata_analysis_status_idx ON cv_metadata(analysis_status);
CREATE INDEX IF NOT EXISTS cv_metadata_upload_date_idx ON cv_metadata(upload_date);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cv_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cv_metadata_updated_at
  BEFORE UPDATE ON cv_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_cv_metadata_updated_at();
