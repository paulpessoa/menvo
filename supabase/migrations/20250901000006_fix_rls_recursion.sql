-- =================================================================
-- FIX RLS RECURSION IN USER_ROLES TABLE
-- Remove recursive policies that cause infinite loops
-- =================================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "admins_can_view_all_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "admins_can_manage_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "admins_can_view_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_can_update_any_profile" ON public.profiles;
DROP POLICY IF EXISTS "admins_can_view_all_availability" ON public.mentor_availability;
DROP POLICY IF EXISTS "admins_can_manage_all_appointments" ON public.appointments;
DROP POLICY IF EXISTS "only_admins_can_modify_roles" ON public.roles;

-- =================================================================
-- SIMPLIFIED POLICIES WITHOUT RECURSION
-- =================================================================

-- For user_roles: Only allow users to manage their own roles
-- Admins will use service role key for admin operations
CREATE POLICY "users_manage_own_roles_only" ON public.user_roles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- For profiles: Allow service role to bypass RLS for admin operations
-- Users can only manage their own profiles
CREATE POLICY "users_manage_own_profiles_only" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- For roles: Allow everyone to read (needed for role selection)
-- Service role will handle admin modifications
CREATE POLICY "everyone_can_read_roles_simple" ON public.roles
  FOR SELECT
  USING (true);

-- =================================================================
-- ENABLE SERVICE ROLE BYPASS
-- =================================================================

-- Service role can bypass RLS for admin operations
-- This is handled in the API endpoints using supabaseAdmin client
