-- Add free_topics field to profiles table
-- This allows mentors to add custom topics beyond the predefined list

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS free_topics TEXT[];

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.free_topics IS 'Custom mentorship topics added by the mentor beyond the predefined list';

-- Update search vector to include free_topics
CREATE OR REPLACE FUNCTION update_profiles_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('portuguese', COALESCE(NEW.first_name, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.last_name, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.bio, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.job_title, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.company, '')), 'C') ||
    setweight(to_tsvector('portuguese', COALESCE(array_to_string(NEW.mentorship_topics, ' '), '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(array_to_string(NEW.free_topics, ' '), '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(array_to_string(NEW.inclusive_tags, ' '), '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
