-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing problematic tables and recreate properly
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;

-- Ensure profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  slug TEXT UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  current_position TEXT,
  current_company TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  personal_website_url TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  expertise_areas TEXT[],
  topics TEXT[],
  inclusion_tags TEXT[],
  languages TEXT[] DEFAULT ARRAY['Português'],
  mentorship_approach TEXT,
  what_to_expect TEXT,
  ideal_mentee TEXT,
  cv_url TEXT,
  role TEXT DEFAULT 'mentee',
  status TEXT DEFAULT 'pending',
  verification_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create permissions table  
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id),
  UNIQUE(user_id, role_id)
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('admin', 'Administrator with full system access'),
  ('mentor', 'Mentor user with mentoring capabilities'),
  ('mentee', 'Mentee user seeking mentorship'),
  ('volunteer', 'Volunteer user for community activities'),
  ('moderator', 'Content moderator')
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (name, description) VALUES
  ('view_mentors', 'View mentor profiles'),
  ('book_sessions', 'Book mentorship sessions'),
  ('provide_mentorship', 'Provide mentorship services'),
  ('manage_availability', 'Manage mentor availability'),
  ('admin_users', 'Administer user accounts'),
  ('admin_verifications', 'Handle profile verifications'),
  ('admin_system', 'Full system administration'),
  ('validate_activities', 'Validate volunteer activities'),
  ('moderate_content', 'Moderate platform content'),
  ('view_reports', 'View system reports'),
  ('manage_roles', 'Manage user roles and permissions')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'admin' -- Admin gets all permissions
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'mentor' AND p.name IN (
  'view_mentors', 'book_sessions', 'provide_mentorship', 'manage_availability'
)
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'mentee' AND p.name IN (
  'view_mentors', 'book_sessions'
)
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'volunteer' AND p.name IN (
  'view_mentors', 'book_sessions'
)
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'moderator' AND p.name IN (
  'view_mentors', 'moderate_content', 'validate_activities'
)
ON CONFLICT DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER SET search_path = public;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_permissions_updated_at ON permissions;
CREATE TRIGGER update_permissions_updated_at
    BEFORE UPDATE ON permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create the user registration trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  first_name TEXT;
  last_name TEXT;
  full_name TEXT;
  user_type TEXT;
  default_role_id UUID;
BEGIN
  -- Log the trigger execution
  RAISE LOG 'handle_new_user trigger executed for user: %', NEW.id;
  
  -- Extract user metadata with better error handling
  BEGIN
    IF NEW.raw_user_meta_data IS NULL THEN
      first_name := 'Unknown';
      last_name := 'User';
      full_name := 'Unknown User';
      user_type := 'mentee';
    ELSE
      first_name := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), ''), 
        NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), 
        'Unknown'
      );
      last_name := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'), ''), 
        'User'
      );
      full_name := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), 
        CONCAT(first_name, ' ', last_name)
      );
      user_type := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'user_type'), ''), 
        'mentee'
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback values if JSON parsing fails
    first_name := 'Unknown';
    last_name := 'User';
    full_name := 'Unknown User';
    user_type := 'mentee';
    RAISE LOG 'Error parsing user metadata for user %, using defaults: %', NEW.id, SQLERRM;
  END;

  -- Insert into profiles table
  BEGIN
    INSERT INTO profiles (
      id, 
      email, 
      first_name, 
      last_name, 
      full_name, 
      role,
      status,
      verification_status,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      LOWER(TRIM(NEW.email)),
      first_name,
      last_name,
      full_name,
      user_type,
      'pending',
      'pending',
      NOW(),
      NOW()
    );
    
    RAISE LOG 'Profile created successfully for user: %', NEW.id;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    -- Don't fail the trigger, just log the error
  END;

  -- Assign default role
  BEGIN
    SELECT id INTO default_role_id FROM roles WHERE name = user_type LIMIT 1;
    
    IF default_role_id IS NOT NULL THEN
      INSERT INTO user_roles (user_id, role_id, is_primary, assigned_at)
      VALUES (NEW.id, default_role_id, TRUE, NOW());
      
      RAISE LOG 'Role assigned successfully for user: %', NEW.id;
    ELSE
      RAISE LOG 'No role found for user_type: %', user_type;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error assigning role for user %: %', NEW.id, SQLERRM;
    -- Don't fail the trigger, just log the error
  END;

  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER SET search_path = public;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID)
RETURNS TABLE(permission_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.name
  FROM permissions p
  JOIN role_permissions rp ON p.id = rp.permission_id
  JOIN user_roles ur ON rp.role_id = ur.role_id
  WHERE ur.user_id = user_uuid AND ur.is_primary = TRUE;
END;
$$ language 'plpgsql' SECURITY DEFINER SET search_path = public;

-- Create function to check user permission
CREATE OR REPLACE FUNCTION user_has_permission(user_uuid UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  has_perm BOOLEAN := FALSE;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM get_user_permissions(user_uuid) 
    WHERE get_user_permissions.permission_name = user_has_permission.permission_name
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$ language 'plpgsql' SECURITY DEFINER SET search_path = public;

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR ALL USING (user_has_permission(auth.uid(), 'admin_users'));

-- Create RLS policies for roles and permissions (admin only)
DROP POLICY IF EXISTS "Admins can manage roles" ON roles;
CREATE POLICY "Admins can manage roles" ON roles
  FOR ALL USING (user_has_permission(auth.uid(), 'manage_roles'));

DROP POLICY IF EXISTS "Everyone can view roles" ON roles;
CREATE POLICY "Everyone can view roles" ON roles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage permissions" ON permissions;
CREATE POLICY "Admins can manage permissions" ON permissions
  FOR ALL USING (user_has_permission(auth.uid(), 'manage_roles'));

DROP POLICY IF EXISTS "Everyone can view permissions" ON permissions;
CREATE POLICY "Everyone can view permissions" ON permissions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage role permissions" ON role_permissions;
CREATE POLICY "Admins can manage role permissions" ON role_permissions
  FOR ALL USING (user_has_permission(auth.uid(), 'manage_roles'));

DROP POLICY IF EXISTS "Everyone can view role permissions" ON role_permissions;
CREATE POLICY "Everyone can view role permissions" ON role_permissions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;
CREATE POLICY "Admins can manage user roles" ON user_roles
  FOR ALL USING (user_has_permission(auth.uid(), 'admin_users'));

DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
CREATE POLICY "Users can view own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
