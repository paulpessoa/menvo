-- Add tables for user roles and permissions management

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role permissions join table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- User roles join table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('admin', 'Administrator with full access'),
  ('mentor', 'Mentor user role'),
  ('mentee', 'Mentee user role')
ON CONFLICT (name) DO NOTHING;

-- Example permissions (customize as needed)
INSERT INTO permissions (name, description) VALUES
  ('view_profiles', 'View user profiles'),
  ('edit_profiles', 'Edit user profiles'),
  ('manage_sessions', 'Manage mentorship sessions'),
  ('manage_reviews', 'Manage reviews'),
  ('admin_actions', 'Perform admin actions')
ON CONFLICT (name) DO NOTHING;
-- Re-enable the trigger for new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  first_name TEXT;
  last_name TEXT;
  full_name TEXT;
  user_type TEXT;
BEGIN
  IF NEW.raw_user_meta_data IS NULL THEN
    first_name := 'Unknown';
    last_name := 'User';
    full_name := 'Unknown User';
    user_type := 'mentee';
  ELSE
    first_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'first_name', ''), 'Unknown');
    last_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'last_name', ''), 'User');
    full_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), CONCAT(first_name, ' ', last_name));
    user_type := COALESCE(NULLIF(NEW.raw_user_meta_data->>'user_type', ''), 'mentee');
  END IF;

  INSERT INTO profiles (id, email, first_name, last_name, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    first_name,
    last_name,
    full_name,
    user_type::user_role
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- The trigger "on_auth_user_created" already exists, so avoid creating it again to prevent errors.
-- You can drop the existing trigger manually if needed before running this script.
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION handle_new_user();
