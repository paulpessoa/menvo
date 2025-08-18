-- =================================================================
-- FIX ROLE SELECTION PERMISSIONS
-- This script fixes the immediate permission issues for role selection
-- =================================================================

-- 1. Add RLS policy to allow authenticated users to read roles table
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.roles;
CREATE POLICY "Authenticated users can view roles" ON public.roles
    FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Add RLS policy for user_roles table
DROP POLICY IF EXISTS "Users can manage own roles" ON public.user_roles;
CREATE POLICY "Users can manage own roles" ON public.user_roles
    FOR ALL USING (auth.uid() = user_id);

-- 3. Verify profiles table has proper policies
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 4. Grant necessary permissions to authenticated role
GRANT SELECT ON public.roles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_roles TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;