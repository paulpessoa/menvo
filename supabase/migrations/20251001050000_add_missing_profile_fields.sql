-- Add missing profile fields for complete profile functionality

-- Add address field for location
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;

-- Add portfolio URL field
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS portfolio_url TEXT;

-- Add mentorship description fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mentorship_approach TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS what_to_expect TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ideal_mentee TEXT;

-- Add total_sessions field if not exists (for future use)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.address IS 'Full address (private, only city/state/country shown publicly)';
COMMENT ON COLUMN public.profiles.portfolio_url IS 'URL to user portfolio website';
COMMENT ON COLUMN public.profiles.mentorship_approach IS 'Description of mentorship approach and methodology';
COMMENT ON COLUMN public.profiles.what_to_expect IS 'What mentees can expect from sessions';
COMMENT ON COLUMN public.profiles.ideal_mentee IS 'Description of ideal mentee profile';
COMMENT ON COLUMN public.profiles.total_sessions IS 'Total number of mentorship sessions completed';