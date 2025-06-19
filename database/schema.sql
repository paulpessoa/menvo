-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('mentee', 'mentor', 'admin');
CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended', 'rejected');
CREATE TYPE mentor_status AS ENUM ('pending_verification', 'verification_scheduled', 'verified', 'rejected', 'suspended');
CREATE TYPE session_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE verification_status AS ENUM ('pending', 'scheduled', 'completed', 'rejected');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  languages TEXT[] DEFAULT '{}',
  role user_role NOT NULL DEFAULT 'mentee',
  status user_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Mentors table
CREATE TABLE mentors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  title TEXT NOT NULL,
  company TEXT,
  experience_years INTEGER NOT NULL CHECK (experience_years >= 0),
  expertise_areas TEXT[] NOT NULL DEFAULT '{}',
  topics TEXT[] NOT NULL DEFAULT '{}',
  inclusion_tags TEXT[] DEFAULT '{}',
  linkedin_url TEXT,
  portfolio_url TEXT,
  academic_background TEXT,
  current_work TEXT,
  areas_of_interest TEXT,
  session_duration INTEGER DEFAULT 45 CHECK (session_duration > 0),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  status mentor_status NOT NULL DEFAULT 'pending_verification',
  verification_notes TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  total_sessions INTEGER DEFAULT 0 CHECK (total_sessions >= 0),
  total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mentor verification table
CREATE TABLE mentor_verification (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mentor_id UUID REFERENCES mentors(id) ON DELETE CASCADE NOT NULL,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('initial', 'renewal')),
  status verification_status NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  notes TEXT,
  documents_submitted BOOLEAN DEFAULT false,
  identity_verified BOOLEAN DEFAULT false,
  expertise_verified BOOLEAN DEFAULT false,
  background_check BOOLEAN DEFAULT false,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mentor availability table
CREATE TABLE mentor_availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mentor_id UUID REFERENCES mentors(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mentor_id, day_of_week, start_time, end_time)
);

-- Mentorship sessions table
CREATE TABLE mentorship_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mentor_id UUID REFERENCES mentors(id) ON DELETE CASCADE NOT NULL,
  mentee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
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
  cancelled_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES mentorship_sessions(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reviewed_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, reviewer_id)
);

-- Admin actions table (for audit trail)
CREATE TABLE admin_actions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'mentor', 'session', 'review')),
  target_id UUID NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_mentors_status ON mentors(status);
CREATE INDEX idx_mentors_user_id ON mentors(user_id);
CREATE INDEX idx_mentors_topics ON mentors USING GIN(topics);
CREATE INDEX idx_mentors_expertise ON mentors USING GIN(expertise_areas);
CREATE INDEX idx_mentors_location ON profiles(location);
CREATE INDEX idx_sessions_mentor_id ON mentorship_sessions(mentor_id);
CREATE INDEX idx_sessions_mentee_id ON mentorship_sessions(mentee_id);
CREATE INDEX idx_sessions_scheduled_at ON mentorship_sessions(scheduled_at);
CREATE INDEX idx_sessions_status ON mentorship_sessions(status);
CREATE INDEX idx_reviews_reviewed_id ON reviews(reviewed_id);
CREATE INDEX idx_verification_mentor_id ON mentor_verification(mentor_id);
CREATE INDEX idx_verification_status ON mentor_verification(status);

-- Create view for verified mentors (public access)
CREATE VIEW verified_mentors AS
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
FROM mentors m
JOIN profiles p ON m.user_id = p.id
WHERE m.status = 'verified' 
  AND p.status = 'active' 
  AND m.is_available = true;

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mentors_updated_at BEFORE UPDATE ON mentors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mentor_verification_updated_at BEFORE UPDATE ON mentor_verification FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mentor_availability_updated_at BEFORE UPDATE ON mentor_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mentorship_sessions_updated_at BEFORE UPDATE ON mentorship_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'mentee')::user_role
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update mentor rating
CREATE OR REPLACE FUNCTION update_mentor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE mentors 
  SET 
    rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM reviews 
      WHERE reviewed_id = (SELECT user_id FROM mentors WHERE id = NEW.mentor_id)
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews 
      WHERE reviewed_id = (SELECT user_id FROM mentors WHERE id = NEW.mentor_id)
    )
  WHERE id = NEW.mentor_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update mentor rating when review is added/updated
CREATE TRIGGER update_mentor_rating_trigger
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_mentor_rating();
