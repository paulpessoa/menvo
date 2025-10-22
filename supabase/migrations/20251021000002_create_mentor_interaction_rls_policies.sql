-- =================================================================
-- MENTOR INTERACTION SYSTEM - Row Level Security Policies
-- Implements security policies for all mentor interaction tables
-- =================================================================

-- =================================================================
-- 1. PARTNERS TABLE POLICIES
-- =================================================================

-- Public read access to active partners
CREATE POLICY "Anyone can view active partners"
  ON public.partners
  FOR SELECT
  USING (is_active = true);

-- Admin-only write access
CREATE POLICY "Admins can insert partners"
  ON public.partners
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      INNER JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'admin'
    )
  );

CREATE POLICY "Admins can update partners"
  ON public.partners
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      INNER JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'admin'
    )
  );

CREATE POLICY "Admins can delete partners"
  ON public.partners
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      INNER JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'admin'
    )
  );

-- =================================================================
-- 2. PARTNER INVITATIONS TABLE POLICIES
-- =================================================================

-- Users can view their own invitations
CREATE POLICY "Users can view their own invitations"
  ON public.partner_invitations
  FOR SELECT
  USING (
    email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

-- Admins can view all invitations
CREATE POLICY "Admins can view all invitations"
  ON public.partner_invitations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      INNER JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'admin'
    )
  );

-- Admins can create invitations
CREATE POLICY "Admins can create invitations"
  ON public.partner_invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      INNER JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'admin'
    )
  );

-- Users can update their own invitations (accept/decline)
CREATE POLICY "Users can update their own invitations"
  ON public.partner_invitations
  FOR UPDATE
  USING (
    email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

-- Admins can update any invitation
CREATE POLICY "Admins can update any invitation"
  ON public.partner_invitations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      INNER JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'admin'
    )
  );

-- =================================================================
-- 3. USER PARTNERS TABLE POLICIES
-- =================================================================

-- Users can view their own partner associations
CREATE POLICY "Users can view their own partner associations"
  ON public.user_partners
  FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all partner associations
CREATE POLICY "Admins can view all partner associations"
  ON public.user_partners
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      INNER JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'admin'
    )
  );

-- System can create partner associations (via invitation acceptance)
CREATE POLICY "System can create partner associations"
  ON public.user_partners
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can create partner associations
CREATE POLICY "Admins can create partner associations"
  ON public.user_partners
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      INNER JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'admin'
    )
  );

-- Users can update their own associations (leave partner)
CREATE POLICY "Users can update their own associations"
  ON public.user_partners
  FOR UPDATE
  USING (user_id = auth.uid());

-- Admins can update any association
CREATE POLICY "Admins can update any association"
  ON public.user_partners
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      INNER JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'admin'
    )
  );

-- =================================================================
-- 4. MENTOR PARTNERS TABLE POLICIES
-- =================================================================

-- Anyone can view active mentor-partner associations (for filtering)
CREATE POLICY "Anyone can view active mentor-partner associations"
  ON public.mentor_partners
  FOR SELECT
  USING (is_active = true);

-- Mentors can view their own associations
CREATE POLICY "Mentors can view their own associations"
  ON public.mentor_partners
  FOR SELECT
  USING (mentor_id = auth.uid());

-- Mentors can manage their own partner associations
CREATE POLICY "Mentors can create their own associations"
  ON public.mentor_partners
  FOR INSERT
  WITH CHECK (
    mentor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      INNER JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'mentor'
    )
  );

CREATE POLICY "Mentors can update their own associations"
  ON public.mentor_partners
  FOR UPDATE
  USING (mentor_id = auth.uid());

CREATE POLICY "Mentors can delete their own associations"
  ON public.mentor_partners
  FOR DELETE
  USING (mentor_id = auth.uid());

-- Admins can manage all associations
CREATE POLICY "Admins can manage all mentor-partner associations"
  ON public.mentor_partners
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      INNER JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'admin'
    )
  );

-- =================================================================
-- 5. CONVERSATIONS TABLE POLICIES
-- =================================================================

-- Users can view conversations they are part of
CREATE POLICY "Users can view their own conversations"
  ON public.conversations
  FOR SELECT
  USING (
    mentor_id = auth.uid() OR mentee_id = auth.uid()
  );

-- Users can create conversations (mentee initiating chat)
CREATE POLICY "Users can create conversations"
  ON public.conversations
  FOR INSERT
  WITH CHECK (
    mentee_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = mentor_id
        AND chat_enabled = true
    )
  );

-- Users can update their own conversations (last_message_at via trigger)
CREATE POLICY "Users can update their own conversations"
  ON public.conversations
  FOR UPDATE
  USING (
    mentor_id = auth.uid() OR mentee_id = auth.uid()
  );

-- =================================================================
-- 6. MESSAGES TABLE POLICIES
-- =================================================================

-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id
        AND (mentor_id = auth.uid() OR mentee_id = auth.uid())
    )
  );

-- Users can send messages in their conversations
CREATE POLICY "Users can send messages in their conversations"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id
        AND (mentor_id = auth.uid() OR mentee_id = auth.uid())
    )
  );

-- Users can update their own messages (mark as read)
CREATE POLICY "Users can update messages in their conversations"
  ON public.messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id
        AND (mentor_id = auth.uid() OR mentee_id = auth.uid())
    )
  );

-- =================================================================
-- 7. MENTORSHIP REQUESTS TABLE POLICIES
-- =================================================================

-- Mentors can view requests sent to them
CREATE POLICY "Mentors can view their mentorship requests"
  ON public.mentorship_requests
  FOR SELECT
  USING (mentor_id = auth.uid());

-- Mentees can view requests they sent
CREATE POLICY "Mentees can view their sent requests"
  ON public.mentorship_requests
  FOR SELECT
  USING (mentee_id = auth.uid());

-- Admins can view all requests
CREATE POLICY "Admins can view all mentorship requests"
  ON public.mentorship_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      INNER JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'admin'
    )
  );

-- Authenticated users can create mentorship requests
CREATE POLICY "Users can create mentorship requests"
  ON public.mentorship_requests
  FOR INSERT
  WITH CHECK (mentee_id = auth.uid());

-- Mentors can update status of their requests
CREATE POLICY "Mentors can update their request status"
  ON public.mentorship_requests
  FOR UPDATE
  USING (mentor_id = auth.uid());

-- =================================================================
-- 8. ENABLE REALTIME FOR CHAT TABLES
-- =================================================================

-- Enable Realtime publications for chat functionality (only if not already added)
DO $$
BEGIN
  -- Add conversations if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
  
  -- Add messages if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- =================================================================
-- 9. GRANT PERMISSIONS
-- =================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON public.partners TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.partner_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_partners TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentor_partners TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.mentorship_requests TO authenticated;

-- Grant permissions to service role for backend operations
GRANT ALL ON public.partners TO service_role;
GRANT ALL ON public.partner_invitations TO service_role;
GRANT ALL ON public.user_partners TO service_role;
GRANT ALL ON public.mentor_partners TO service_role;
GRANT ALL ON public.conversations TO service_role;
GRANT ALL ON public.messages TO service_role;
GRANT ALL ON public.mentorship_requests TO service_role;

-- =================================================================
-- 10. CREATE HELPER VIEWS FOR COMMON QUERIES
-- =================================================================

-- View for mentors with their partner associations
CREATE OR REPLACE VIEW public.mentors_with_partners AS
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.avatar_url,
  p.bio,
  p.expertise_areas,
  p.mentorship_topics,
  p.chat_enabled,
  p.profile_visibility,
  p.availability_status,
  p.mentorship_guidelines,
  COALESCE(
    array_agg(
      DISTINCT jsonb_build_object(
        'id', pt.id,
        'name', pt.name,
        'slug', pt.slug
      )
    ) FILTER (WHERE pt.id IS NOT NULL),
    ARRAY[]::jsonb[]
  ) as partners
FROM public.profiles p
INNER JOIN public.user_roles ur ON p.id = ur.user_id
INNER JOIN public.roles r ON ur.role_id = r.id
LEFT JOIN public.mentor_partners mp ON p.id = mp.mentor_id AND mp.is_active = true
LEFT JOIN public.partners pt ON mp.partner_id = pt.id AND pt.is_active = true
WHERE r.name = 'mentor'
GROUP BY p.id;

-- Grant access to the view
GRANT SELECT ON public.mentors_with_partners TO authenticated;
GRANT SELECT ON public.mentors_with_partners TO anon;

COMMENT ON VIEW public.mentors_with_partners IS 'View of mentors with their associated partner programs';
