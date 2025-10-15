-- Fix feedback RLS to allow both authenticated and anonymous feedback properly
-- Drop the problematic policy
DROP POLICY IF EXISTS "Allow feedback insertion" ON feedback;

-- Create a simpler policy that allows:
-- 1. Authenticated users to insert feedback (with or without user_id)
-- 2. Anonymous users to insert feedback with user_id = NULL
CREATE POLICY "Allow all feedback insertion" ON feedback
  FOR INSERT 
  WITH CHECK (
    -- Allow if user is authenticated (regardless of user_id value)
    auth.uid() IS NOT NULL OR
    -- Allow if user is anonymous and user_id is NULL
    (auth.uid() IS NULL AND user_id IS NULL)
  );
