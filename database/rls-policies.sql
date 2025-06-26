-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

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

-- FEEDBACK POLICIES
-- Qualquer usuário pode inserir feedback (autenticado ou não)
CREATE POLICY "Anyone can insert feedback" ON feedback
  FOR INSERT WITH CHECK (true);

-- Usuário autenticado pode ver seu próprio feedback ou feedbacks anônimos
CREATE POLICY "Users can view own feedback" ON feedback
  FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

-- Admin pode ver todos os feedbacks
CREATE POLICY "Admins can view all feedback" ON feedback
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- NEWSLETTER POLICIES
-- Qualquer usuário pode se inscrever na newsletter
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscriptions
  FOR INSERT WITH CHECK (true);

-- Usuário pode ver/cancelar sua própria inscrição (por email)
CREATE POLICY "User can view own subscription" ON newsletter_subscriptions
  FOR SELECT USING (email = auth.email());

CREATE POLICY "User can unsubscribe own subscription" ON newsletter_subscriptions
  FOR UPDATE USING (email = auth.email());

-- Admin pode ver todas as inscrições
CREATE POLICY "Admins can view all newsletter subscriptions" ON newsletter_subscriptions
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
