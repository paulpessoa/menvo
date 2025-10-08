-- Add cv_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cv_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN public.profiles.cv_url IS 'URL to user CV/resume PDF file stored in Supabase Storage';