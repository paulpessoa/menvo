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

-- RLS POLICIES
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role = 'admin' AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is verified mentor
CREATE OR REPLACE FUNCTION is_verified_mentor(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM mentors m
    JOIN profiles p ON m.user_id = p.id
    WHERE m.user_id = user_id 
      AND m.status = 'verified' 
      AND p.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES POLICIES
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (is_admin(auth.uid()));

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (is_admin(auth.uid()));

-- Public can view basic info of active users (for mentor listings)
CREATE POLICY "Public can view active user basics" ON profiles
  FOR SELECT USING (status = 'active');

-- MENTORS POLICIES
-- Mentors can view and update their own mentor profile
CREATE POLICY "Mentors can manage own profile" ON mentors
  FOR ALL USING (auth.uid() = user_id);

-- Public can view verified mentors
CREATE POLICY "Public can view verified mentors" ON mentors
  FOR SELECT USING (status = 'verified');

-- Admins can manage all mentor profiles
CREATE POLICY "Admins can manage all mentors" ON mentors
  FOR ALL USING (is_admin(auth.uid()));

-- MENTOR VERIFICATION POLICIES
-- Only admins can manage verification records
CREATE POLICY "Admins can manage verifications" ON mentor_verification
  FOR ALL USING (is_admin(auth.uid()));

-- Mentors can view their own verification status
CREATE POLICY "Mentors can view own verification" ON mentor_verification
  FOR SELECT USING (
    mentor_id IN (SELECT id FROM mentors WHERE user_id = auth.uid())
  );

-- MENTOR AVAILABILITY POLICIES
-- Mentors can manage their own availability
CREATE POLICY "Mentors can manage own availability" ON mentor_availability
  FOR ALL USING (
    mentor_id IN (SELECT id FROM mentors WHERE user_id = auth.uid())
  );

-- Public can view availability of verified mentors
CREATE POLICY "Public can view verified mentor availability" ON mentor_availability
  FOR SELECT USING (
    mentor_id IN (SELECT id FROM mentors WHERE status = 'verified')
  );

-- Admins can view all availability
CREATE POLICY "Admins can view all availability" ON mentor_availability
  FOR SELECT USING (is_admin(auth.uid()));

-- MENTORSHIP SESSIONS POLICIES
-- Users can view sessions they're involved in
CREATE POLICY "Users can view own sessions" ON mentorship_sessions
  FOR SELECT USING (
    mentee_id = auth.uid() OR 
    mentor_id IN (SELECT id FROM mentors WHERE user_id = auth.uid())
  );

-- Mentees can create sessions with verified mentors
CREATE POLICY "Mentees can create sessions" ON mentorship_sessions
  FOR INSERT WITH CHECK (
    mentee_id = auth.uid() AND
    mentor_id IN (SELECT id FROM mentors WHERE status = 'verified')
  );

-- Users can update sessions they're involved in (for cancellation, notes, etc.)
CREATE POLICY "Users can update own sessions" ON mentorship_sessions
  FOR UPDATE USING (
    mentee_id = auth.uid() OR 
    mentor_id IN (SELECT id FROM mentors WHERE user_id = auth.uid())
  );

-- Admins can manage all sessions
CREATE POLICY "Admins can manage all sessions" ON mentorship_sessions
  FOR ALL USING (is_admin(auth.uid()));

-- REVIEWS POLICIES
-- Users can create reviews for completed sessions they participated in
CREATE POLICY "Users can create reviews for own sessions" ON reviews
  FOR INSERT WITH CHECK (
    reviewer_id = auth.uid() AND
    session_id IN (
      SELECT id FROM mentorship_sessions 
      WHERE (mentee_id = auth.uid() OR mentor_id IN (
        SELECT id FROM mentors WHERE user_id = auth.uid()
      )) AND status = 'completed'
    )
  );

-- Users can view public reviews
CREATE POLICY "Public can view public reviews" ON reviews
  FOR SELECT USING (is_public = true);

-- Users can view their own reviews (given and received)
CREATE POLICY "Users can view own reviews" ON reviews
  FOR SELECT USING (
    reviewer_id = auth.uid() OR 
    reviewed_id = auth.uid()
  );

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (reviewer_id = auth.uid());

-- Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews" ON reviews
  FOR ALL USING (is_admin(auth.uid()));

-- ADMIN ACTIONS POLICIES
-- Only admins can create admin actions
CREATE POLICY "Admins can create admin actions" ON admin_actions
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- Only admins can view admin actions
CREATE POLICY "Admins can view admin actions" ON admin_actions
  FOR SELECT USING (is_admin(auth.uid()));

-- Grant access to verified_mentors view
GRANT SELECT ON verified_mentors TO authenticated, anon;

-- VERIFICATION FUNCTIONS
-- Function to request mentor verification
CREATE OR REPLACE FUNCTION request_mentor_verification(mentor_user_id UUID)
RETURNS UUID AS $$
DECLARE
  mentor_record RECORD;
  verification_id UUID;
BEGIN
  -- Check if user is a mentor
  SELECT * INTO mentor_record FROM mentors WHERE user_id = mentor_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User is not a mentor';
  END IF;
  
  -- Check if mentor is in correct status
  IF mentor_record.status != 'pending_verification' THEN
    RAISE EXCEPTION 'Mentor is not in pending verification status';
  END IF;
  
  -- Create verification record
  INSERT INTO mentor_verification (mentor_id, verification_type, status)
  VALUES (mentor_record.id, 'initial', 'pending')
  RETURNING id INTO verification_id;
  
  RETURN verification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to schedule verification (admin only)
CREATE OR REPLACE FUNCTION schedule_mentor_verification(
  verification_id UUID,
  scheduled_datetime TIMESTAMPTZ,
  admin_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin(admin_id) THEN
    RAISE EXCEPTION 'Only admins can schedule verifications';
  END IF;
  
  -- Update verification record
  UPDATE mentor_verification 
  SET 
    status = 'scheduled',
    scheduled_at = scheduled_datetime,
    updated_at = NOW()
  WHERE id = verification_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification not found or not in pending status';
  END IF;
  
  -- Update mentor status
  UPDATE mentors 
  SET status = 'verification_scheduled'
  WHERE id = (SELECT mentor_id FROM mentor_verification WHERE id = verification_id);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete verification (admin only)
CREATE OR REPLACE FUNCTION complete_mentor_verification(
  verification_id UUID,
  admin_id UUID,
  verification_passed BOOLEAN,
  verification_notes TEXT DEFAULT NULL,
  documents_ok BOOLEAN DEFAULT TRUE,
  identity_ok BOOLEAN DEFAULT TRUE,
  expertise_ok BOOLEAN DEFAULT TRUE,
  background_ok BOOLEAN DEFAULT TRUE
)
RETURNS BOOLEAN AS $$
DECLARE
  mentor_id_var UUID;
  mentor_user_id UUID;
BEGIN
  -- Check if user is admin
  IF NOT is_admin(admin_id) THEN
    RAISE EXCEPTION 'Only admins can complete verifications';
  END IF;
  
  -- Get mentor info
  SELECT mentor_id INTO mentor_id_var 
  FROM mentor_verification 
  WHERE id = verification_id;
  
  SELECT user_id INTO mentor_user_id 
  FROM mentors 
  WHERE id = mentor_id_var;
  
  IF verification_passed THEN
    -- Update verification record as completed
    UPDATE mentor_verification 
    SET 
      status = 'completed',
      completed_at = NOW(),
      verified_by = admin_id,
      notes = verification_notes,
      documents_submitted = documents_ok,
      identity_verified = identity_ok,
      expertise_verified = expertise_ok,
      background_check = background_ok,
      updated_at = NOW()
    WHERE id = verification_id;
    
    -- Update mentor status to verified
    UPDATE mentors 
    SET 
      status = 'verified',
      verified_at = NOW(),
      verified_by = admin_id,
      verification_notes = verification_notes
    WHERE id = mentor_id_var;
    
    -- Update user profile to active
    UPDATE profiles 
    SET status = 'active'
    WHERE id = mentor_user_id;
    
  ELSE
    -- Update verification record as rejected
    UPDATE mentor_verification 
    SET 
      status = 'rejected',
      completed_at = NOW(),
      verified_by = admin_id,
      notes = verification_notes,
      rejection_reason = verification_notes,
      updated_at = NOW()
    WHERE id = verification_id;
    
    -- Update mentor status to rejected
    UPDATE mentors 
    SET 
      status = 'rejected',
      verification_notes = verification_notes
    WHERE id = mentor_id_var;
  END IF;
  
  -- Log admin action
  INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details, reason)
  VALUES (
    admin_id,
    CASE WHEN verification_passed THEN 'mentor_verified' ELSE 'mentor_rejected' END,
    'mentor',
    mentor_id_var,
    jsonb_build_object(
      'verification_id', verification_id,
      'documents_submitted', documents_ok,
      'identity_verified', identity_ok,
      'expertise_verified', expertise_ok,
      'background_check', background_ok
    ),
    verification_notes
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending verifications (admin only)
CREATE OR REPLACE FUNCTION get_pending_verifications(admin_id UUID)
RETURNS TABLE (
  verification_id UUID,
  mentor_id UUID,
  mentor_name TEXT,
  mentor_email TEXT,
  mentor_title TEXT,
  mentor_company TEXT,
  verification_type TEXT,
  status verification_status,
  created_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin(admin_id) THEN
    RAISE EXCEPTION 'Only admins can view pending verifications';
  END IF;
  
  RETURN QUERY
  SELECT 
    mv.id,
    m.id,
    p.full_name,
    p.email,
    m.title,
    m.company,
    mv.verification_type,
    mv.status,
    mv.created_at,
    mv.scheduled_at
  FROM mentor_verification mv
  JOIN mentors m ON mv.mentor_id = m.id
  JOIN profiles p ON m.user_id = p.id
  WHERE mv.status IN ('pending', 'scheduled')
  ORDER BY mv.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
