-- Drop existing objects if they exist to allow for re-running the script
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_mentors_updated_at ON public.mentors;
DROP TRIGGER IF EXISTS on_profile_created_or_updated ON public.profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can view active mentor profiles" ON public.profiles;
DROP POLICY IF EXISTS "Mentors can manage own profile" ON public.mentors;
DROP POLICY IF EXISTS "Public can view verified mentors" ON public.mentors;
DROP POLICY IF EXISTS "Admins can manage all mentors" ON public.mentors;

DROP VIEW IF EXISTS public.verified_mentors;

DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.generate_slug(name_text TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.set_profile_slug() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(user_id UUID) CASCADE;

DROP TABLE IF EXISTS public.admin_actions CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.mentorship_sessions CASCADE;
DROP TABLE IF EXISTS public.mentor_availability CASCADE;
DROP TABLE IF EXISTS public.mentor_verification CASCADE;
DROP TABLE IF EXISTS public.mentors CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS user_status;
DROP TYPE IF EXISTS session_status;
DROP TYPE IF EXISTS verification_status;

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Custom Types
CREATE TYPE user_role AS ENUM ('mentee', 'mentor', 'admin', 'company', 'recruiter');
CREATE TYPE user_status AS ENUM ('pending_verification', 'active', 'suspended', 'rejected');
CREATE TYPE session_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE verification_status AS ENUM ('pending', 'scheduled', 'completed', 'rejected');

-- 3. Tables
-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  languages TEXT[],
  role user_role NOT NULL DEFAULT 'mentee',
  status user_status NOT NULL DEFAULT 'pending_verification',
  slug TEXT UNIQUE,
  profile_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);
COMMENT ON TABLE public.profiles IS 'Stores public-facing profile information for all users.';

-- Mentors table (specific data for mentors)
CREATE TABLE public.mentors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  title TEXT,
  company TEXT,
  experience_years INTEGER CHECK (experience_years >= 0),
  expertise_areas TEXT[],
  topics TEXT[],
  inclusion_tags TEXT[],
  linkedin_url TEXT,
  portfolio_url TEXT,
  academic_background TEXT,
  current_work TEXT,
  areas_of_interest TEXT,
  session_duration INTEGER DEFAULT 45 CHECK (session_duration > 0),
  timezone TEXT DEFAULT 'UTC',
  status user_status NOT NULL DEFAULT 'pending_verification',
  verification_notes TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),
  rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  total_sessions INTEGER DEFAULT 0 CHECK (total_sessions >= 0),
  total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.mentors IS 'Stores mentor-specific professional information.';

-- Other tables from your original schema...
-- (mentor_verification, mentor_availability, mentorship_sessions, reviews, admin_actions)
-- These are included for completeness but are unchanged from your original schema.sql

CREATE TABLE public.mentor_verification (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mentor_id UUID REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('initial', 'renewal')),
  status verification_status NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  documents_submitted BOOLEAN DEFAULT false,
  identity_verified BOOLEAN DEFAULT false,
  expertise_verified BOOLEAN DEFAULT false,
  background_check BOOLEAN DEFAULT false,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.mentor_availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mentor_id UUID REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mentor_id, day_of_week, start_time, end_time)
);

CREATE TABLE public.mentorship_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mentor_id UUID REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
  mentee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL DEFAULT 45 CHECK (duration > 0),
  status session_status NOT NULL DEFAULT 'scheduled',
  topics TEXT[] NOT NULL DEFAULT '{}',
  mentee_notes TEXT,
  mentor_notes TEXT,
  meeting_url TEXT,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.mentorship_sessions(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reviewed_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, reviewer_id)
);

CREATE TABLE public.admin_actions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'mentor', 'session', 'review')),
  target_id UUID NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 4. Indexes
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_status ON public.profiles(status);
CREATE INDEX idx_mentors_status ON public.mentors(status);
CREATE INDEX idx_mentors_user_id ON public.mentors(user_id);
CREATE INDEX idx_mentors_topics ON public.mentors USING GIN(topics);
CREATE INDEX idx_mentors_expertise ON public.mentors USING GIN(expertise_areas);
CREATE INDEX idx_sessions_mentor_id ON public.mentorship_sessions(mentor_id);
CREATE INDEX idx_sessions_mentee_id ON public.mentorship_sessions(mentee_id);
CREATE INDEX idx_reviews_reviewed_id ON public.reviews(reviewed_id);

-- 5. Views
CREATE OR REPLACE VIEW public.verified_mentors AS
SELECT
  m.id,
  m.user_id,
  p.full_name,
  p.avatar_url,
  p.bio,
  p.location,
  p.languages,
  m.title,
  m.company,
  m.experience_years,
  m.expertise_areas,
  m.topics,
  m.inclusion_tags,
  m.rating,
  m.total_sessions,
  m.total_reviews,
  m.is_available
FROM public.mentors m
JOIN public.profiles p ON m.user_id = p.id
WHERE m.status = 'active'
  AND p.status = 'active'
  AND m.is_available = true;

-- 6. Functions & Triggers

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mentors_updated_at BEFORE UPDATE ON public.mentors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- ... add for other tables as needed

-- Function to generate a unique slug
CREATE OR REPLACE FUNCTION public.generate_slug(name_text TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 1;
BEGIN
  base_slug := lower(name_text);
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-|-$', '', 'g');
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE slug = final_slug) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to set slug on profile creation/update
CREATE OR REPLACE FUNCTION public.set_profile_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.full_name IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.full_name != OLD.full_name) THEN
    NEW.slug := public.generate_slug(NEW.full_name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set the slug
CREATE TRIGGER on_profile_created_or_updated
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_profile_slug();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  first_name_val TEXT;
  last_name_val TEXT;
  full_name_val TEXT;
  user_role_val user_role;
BEGIN
  first_name_val := COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1));
  last_name_val := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  full_name_val := trim(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', first_name_val || ' ' || last_name_val));
  user_role_val := COALESCE((NEW.raw_user_meta_data->>'user_type')::user_role, 'mentee');

  INSERT INTO public.profiles (id, email, first_name, last_name, full_name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    first_name_val,
    last_name_val,
    full_name_val,
    user_role_val,
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- If user is a mentor, create a mentor record
  IF user_role_val = 'mentor' THEN
    INSERT INTO public.mentors (user_id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
-- ... enable for other tables

-- Helper function to check for admin role
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin' AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Public can view active mentor profiles" ON public.profiles
  FOR SELECT USING (status = 'active' AND role = 'mentor');

-- Mentors Policies
CREATE POLICY "Mentors can manage own profile" ON public.mentors
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can view verified mentors" ON public.mentors
  FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage all mentors" ON public.mentors
  FOR ALL USING (public.is_admin(auth.uid()));

-- Grant access to view
GRANT SELECT ON public.verified_mentors TO authenticated, anon;
