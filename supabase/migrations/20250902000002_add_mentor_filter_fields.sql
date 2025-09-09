-- =================================================================
-- ADD MENTOR FILTER FIELDS
-- Expand profiles table to support comprehensive filtering
-- =================================================================

-- Add location and demographic fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Add language support (array of language codes)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY['pt-BR'];

-- Add professional fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience_years INTEGER;

-- Add mentorship specific fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mentorship_topics TEXT[]; -- Main topics they mentor on
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS inclusive_tags TEXT[]; -- Diversity and inclusion tags
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS session_price_usd DECIMAL(10,2); -- Price per session in USD
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'unavailable'));

-- Add social and contact fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS twitter_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add rating and review fields for future use
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT 0;

-- Add search optimization
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create indexes for filtering performance
CREATE INDEX IF NOT EXISTS idx_profiles_age ON public.profiles(age) WHERE age IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_state ON public.profiles(state) WHERE state IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country) WHERE country IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_languages ON public.profiles USING GIN(languages) WHERE languages IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_topics ON public.profiles USING GIN(mentorship_topics) WHERE mentorship_topics IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_inclusive_tags ON public.profiles USING GIN(inclusive_tags) WHERE inclusive_tags IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_availability_status ON public.profiles(availability_status);
CREATE INDEX IF NOT EXISTS idx_profiles_price ON public.profiles(session_price_usd) WHERE session_price_usd IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON public.profiles(average_rating) WHERE average_rating > 0;
CREATE INDEX IF NOT EXISTS idx_profiles_search_vector ON public.profiles USING GIN(search_vector) WHERE search_vector IS NOT NULL;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION public.update_profile_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('portuguese', COALESCE(NEW.full_name, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.bio, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.job_title, '')), 'C') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.company, '')), 'C') ||
    setweight(to_tsvector('portuguese', COALESCE(array_to_string(NEW.mentorship_topics, ' '), '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(array_to_string(NEW.expertise_areas, ' '), '')), 'A');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
DROP TRIGGER IF EXISTS update_profile_search_vector_trigger ON public.profiles;
CREATE TRIGGER update_profile_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_search_vector();

-- Update existing profiles to have search vectors
UPDATE public.profiles SET updated_at = NOW() WHERE search_vector IS NULL;

COMMENT ON COLUMN public.profiles.age IS 'Mentor age for demographic filtering';
COMMENT ON COLUMN public.profiles.city IS 'City for location-based filtering';
COMMENT ON COLUMN public.profiles.state IS 'State/Province for location filtering';
COMMENT ON COLUMN public.profiles.country IS 'Country for location filtering';
COMMENT ON COLUMN public.profiles.languages IS 'Languages spoken by mentor';
COMMENT ON COLUMN public.profiles.mentorship_topics IS 'Main topics/themes the mentor specializes in';
COMMENT ON COLUMN public.profiles.inclusive_tags IS 'Diversity and inclusion tags (e.g., LGBTQ+, Women in Tech, etc.)';
COMMENT ON COLUMN public.profiles.session_price_usd IS 'Price per mentorship session in USD';
COMMENT ON COLUMN public.profiles.availability_status IS 'Current availability status of the mentor';
COMMENT ON COLUMN public.profiles.search_vector IS 'Full-text search vector for efficient searching';
