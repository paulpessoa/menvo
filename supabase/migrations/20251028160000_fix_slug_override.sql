-- Fix slug override issue - respect user-defined slugs
-- Only auto-generate slug if it's empty or unchanged from default

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS update_profile_slug_trigger ON public.profiles;

-- Update the function to respect user-defined slugs
CREATE OR REPLACE FUNCTION public.update_profile_slug()
RETURNS TRIGGER AS $$
DECLARE
  new_slug TEXT;
  is_auto_generated BOOLEAN;
BEGIN
  -- Check if slug looks auto-generated (ends with -number pattern)
  is_auto_generated := OLD.slug ~ '-\d+$';
  
  -- Only update slug if:
  -- 1. Slug is NULL or empty, OR
  -- 2. Slug appears to be auto-generated (ends with -number), OR
  -- 3. User explicitly changed the slug field
  IF (OLD.slug IS NULL OR OLD.slug = '' OR 
      (is_auto_generated AND OLD.slug = NEW.slug)) AND
     (OLD.first_name IS DISTINCT FROM NEW.first_name OR OLD.last_name IS DISTINCT FROM NEW.last_name) AND
     (NEW.first_name IS NOT NULL OR NEW.last_name IS NOT NULL) THEN
    
    new_slug := public.generate_unique_slug(COALESCE(NEW.full_name, NEW.first_name, NEW.last_name));
    
    -- Only update if the new slug is different
    IF new_slug != OLD.slug THEN
      NEW.slug := new_slug;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_profile_slug_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_slug();

-- Add comment for documentation
COMMENT ON FUNCTION public.update_profile_slug() IS 
  'Auto-generates slug from name only if slug is empty or appears auto-generated. Respects user-defined custom slugs.';
