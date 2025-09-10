-- Fix feedback RLS policies to allow anonymous feedback
-- This migration corrects the RLS policies for the feedback table

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert feedback" ON feedback;
DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;

-- Create new policies that properly handle anonymous feedback
-- Allow authenticated users to insert their own feedback OR allow anonymous feedback
CREATE POLICY "Allow feedback insertion" ON feedback
  FOR INSERT 
  WITH CHECK (
    -- Authenticated users can insert with their user_id
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    -- Anonymous users can insert with user_id = NULL
    (auth.uid() IS NULL AND user_id IS NULL)
  );

-- Users can view their own feedback (authenticated users only)
CREATE POLICY "Users can view own feedback" ON feedback
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow anonymous feedback to be viewed by anyone (for admin purposes)
CREATE POLICY "Allow anonymous feedback viewing" ON feedback
  FOR SELECT 
  USING (user_id IS NULL);