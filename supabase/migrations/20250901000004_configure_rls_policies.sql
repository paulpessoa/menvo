-- =================================================================
-- CONFIGURE ROW LEVEL SECURITY POLICIES - Auth Refactor MVP
-- Secure access policies for all tables
-- =================================================================

-- =================================================================
-- 1. PROFILES TABLE POLICIES
-- =================================================================

-- Users can view their own profile
CREATE POLICY "users_can_view_own_profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_can_update_own_profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Public can view verified mentors (for mentor listing page)
CREATE POLICY "public_can_view_verified_mentors" ON public.profiles
  FOR SELECT
  USING (
    verified = true 
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur 
      JOIN public.roles r ON ur.role_id = r.id 
      WHERE ur.user_id = profiles.id AND r.name = 'mentor'
    )
  );

-- Admins can view all profiles
CREATE POLICY "admins_can_view_all_profiles" ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Admins can update any profile (for verification)
CREATE POLICY "admins_can_update_any_profile" ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- =================================================================
-- 2. USER_ROLES TABLE POLICIES
-- =================================================================

-- Users can view their own roles
CREATE POLICY "users_can_view_own_roles" ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own role (for role selection)
CREATE POLICY "users_can_insert_own_role" ON public.user_roles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own role (for role changes)
CREATE POLICY "users_can_update_own_role" ON public.user_roles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all user roles
CREATE POLICY "admins_can_view_all_user_roles" ON public.user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Admins can manage any user roles
CREATE POLICY "admins_can_manage_user_roles" ON public.user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- =================================================================
-- 3. MENTOR_AVAILABILITY TABLE POLICIES
-- =================================================================

-- Mentors can manage their own availability
CREATE POLICY "mentors_can_manage_own_availability" ON public.mentor_availability
  FOR ALL
  USING (auth.uid() = mentor_id);

-- Public can view availability of verified mentors
CREATE POLICY "public_can_view_verified_mentor_availability" ON public.mentor_availability
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.user_roles ur ON p.id = ur.user_id
      JOIN public.roles r ON ur.role_id = r.id
      WHERE p.id = mentor_id 
        AND p.verified = true 
        AND r.name = 'mentor'
    )
  );

-- Admins can view all availability
CREATE POLICY "admins_can_view_all_availability" ON public.mentor_availability
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- =================================================================
-- 4. APPOINTMENTS TABLE POLICIES
-- =================================================================

-- Users can view appointments where they are mentor or mentee
CREATE POLICY "users_can_view_own_appointments" ON public.appointments
  FOR SELECT
  USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);

-- Mentees can create appointments with verified mentors
CREATE POLICY "mentees_can_create_appointments" ON public.appointments
  FOR INSERT
  WITH CHECK (
    auth.uid() = mentee_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.user_roles ur ON p.id = ur.user_id
      JOIN public.roles r ON ur.role_id = r.id
      WHERE p.id = mentor_id 
        AND p.verified = true 
        AND r.name = 'mentor'
    )
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'mentee'
    )
  );

-- Mentors and mentees can update their own appointments
CREATE POLICY "users_can_update_own_appointments" ON public.appointments
  FOR UPDATE
  USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);

-- Admins can view and manage all appointments
CREATE POLICY "admins_can_manage_all_appointments" ON public.appointments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- =================================================================
-- 5. ROLES TABLE POLICIES (READ-ONLY FOR USERS)
-- =================================================================

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Everyone can read roles (needed for role selection)
CREATE POLICY "everyone_can_read_roles" ON public.roles
  FOR SELECT
  USING (true);

-- Only admins can modify roles
CREATE POLICY "only_admins_can_modify_roles" ON public.roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- =================================================================
-- 6. STORAGE POLICIES FOR AVATARS
-- =================================================================

-- Users can upload their own avatars
CREATE POLICY "users_can_upload_own_avatar" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own avatars
CREATE POLICY "users_can_update_own_avatar" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own avatars
CREATE POLICY "users_can_delete_own_avatar" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public can view all avatars (since profiles are public for verified mentors)
CREATE POLICY "public_can_view_avatars" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');