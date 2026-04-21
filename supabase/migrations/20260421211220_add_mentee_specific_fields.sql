-- =================================================================
-- ADD MENTEE SPECIFIC FIELDS
-- Improve profile structure for students and career transitioners
-- =================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS institution TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS academic_level TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expected_graduation TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mentee_status TEXT; -- Ex: 'searching_internship', 'active'
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_in_community BOOLEAN DEFAULT false;

-- Add comments for better understanding in the DB
COMMENT ON COLUMN public.profiles.institution IS 'Educational institution (for mentees) or current workplace (for mentors)';
COMMENT ON COLUMN public.profiles.course IS 'Major or course of study (for mentees)';

-- Create an index for mentees who want to be seen
CREATE INDEX IF NOT EXISTS idx_profiles_show_in_community ON public.profiles(show_in_community) WHERE show_in_community = true;
