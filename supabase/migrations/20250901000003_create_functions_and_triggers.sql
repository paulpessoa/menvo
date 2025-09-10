-- =================================================================
-- CREATE ESSENTIAL FUNCTIONS AND TRIGGERS - Auth Refactor MVP
-- Minimal functions and triggers for automated profile management
-- =================================================================

-- =================================================================
-- 1. UTILITY FUNCTIONS
-- =================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique slug from name
CREATE OR REPLACE FUNCTION public.generate_unique_slug(base_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base slug from name (lowercase, replace spaces with hyphens, remove special chars)
  base_slug := lower(regexp_replace(trim(base_name), '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := trim(base_slug, '-');
  
  -- If empty after cleaning, use a default
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'user';
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- 2. PROFILE MANAGEMENT FUNCTIONS
-- =================================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_slug TEXT;
BEGIN
  -- Generate slug from email (before @ symbol)
  user_slug := public.generate_unique_slug(split_part(NEW.email, '@', 1));
  
  -- Create profile for new user (no role assigned initially)
  INSERT INTO public.profiles (
    id,
    email,
    slug,
    verified,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    user_slug,
    false,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update slug when name changes
CREATE OR REPLACE FUNCTION public.update_profile_slug()
RETURNS TRIGGER AS $$
DECLARE
  new_slug TEXT;
BEGIN
  -- Only update slug if name fields changed and we have a name
  IF (OLD.first_name IS DISTINCT FROM NEW.first_name OR OLD.last_name IS DISTINCT FROM NEW.last_name) 
     AND (NEW.first_name IS NOT NULL OR NEW.last_name IS NOT NULL) THEN
    
    new_slug := public.generate_unique_slug(COALESCE(NEW.full_name, NEW.first_name, NEW.last_name));
    
    -- Only update if the new slug is different
    IF new_slug != OLD.slug THEN
      NEW.slug := new_slug;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- 3. ROLE MANAGEMENT FUNCTIONS
-- =================================================================

-- Function to assign role to user
CREATE OR REPLACE FUNCTION public.assign_user_role(user_id UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  role_id INTEGER;
BEGIN
  -- Get role ID
  SELECT id INTO role_id FROM public.roles WHERE name = role_name;
  
  IF role_id IS NULL THEN
    RAISE EXCEPTION 'Role % does not exist', role_name;
  END IF;
  
  -- Insert or update user role
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (user_id, role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  role_name TEXT;
BEGIN
  SELECT r.name
  INTO role_name
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = user_id
  LIMIT 1;
  
  RETURN role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- 4. CREATE TRIGGERS
-- =================================================================

-- Trigger to create profile when user signs up
CREATE TRIGGER handle_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update slug when name changes
CREATE TRIGGER update_profile_slug_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_slug();

-- Trigger to update updated_at on user_roles
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update updated_at on mentor_availability
CREATE TRIGGER update_mentor_availability_updated_at
  BEFORE UPDATE ON public.mentor_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update updated_at on appointments
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();