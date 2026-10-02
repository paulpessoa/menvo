-- Restrict 'profiles' table read access to protect mentee privacy in the Community.
-- Mentees (and public) can still read Mentor profiles.
-- Mentors and Admins can read all public profiles (including mentees).
-- Everyone can read their own profile.

-- 1. Drop existing permissive public profile policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- 2. Create the new restrictive policy
-- (idempotent: it was first applied by hand in the SQL editor, so `db push`
-- found it already there and stopped)
DROP POLICY IF EXISTS "Public profiles visibility restricted" ON public.profiles;
CREATE POLICY "Public profiles visibility restricted"
ON public.profiles
FOR SELECT USING (
  -- Always allow viewing own profile
  id = (select auth.uid())
  OR
  (
    is_public = true AND (
      -- Viewer is admin or mentor: can see all public profiles (mentors and mentees)
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = (select auth.uid()) AND role_id IN (
          SELECT id FROM public.roles WHERE name IN ('mentor', 'admin')
        )
      )
      OR
      -- Target profile is a mentor: can be seen by anyone
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = profiles.id AND role_id = (
          SELECT id FROM public.roles WHERE name = 'mentor'
        )
      )
    )
  )
);
