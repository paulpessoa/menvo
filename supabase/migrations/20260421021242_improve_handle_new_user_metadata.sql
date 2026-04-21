-- =================================================================
-- IMPROVE HANDLE NEW USER METADATA
-- Extract first_name and last_name from raw_user_meta_data during registration
-- =================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_slug TEXT;
  meta_first_name TEXT;
  meta_last_name TEXT;
BEGIN
  -- Extract names from metadata if available (Google/LinkedIn common paths)
  meta_first_name := NEW.raw_user_meta_data->>'first_name';
  meta_last_name := NEW.raw_user_meta_data->>'last_name';
  
  -- Fallback for Google/LinkedIn full_name
  IF meta_first_name IS NULL AND NEW.raw_user_meta_data->>'full_name' IS NOT NULL THEN
    meta_first_name := split_part(NEW.raw_user_meta_data->>'full_name', ' ', 1);
    meta_last_name := substring(NEW.raw_user_meta_data->>'full_name' from position(' ' in NEW.raw_user_meta_data->>'full_name') + 1);
  END IF;

  -- Generate slug from email (before @ symbol)
  user_slug := public.generate_unique_slug(split_part(NEW.email, '@', 1));
  
  -- Create profile for new user
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    slug,
    verified,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    meta_first_name,
    meta_last_name,
    user_slug,
    false,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
