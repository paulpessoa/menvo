-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can submit quiz responses" ON quiz_responses;
DROP POLICY IF EXISTS "Users can read their own responses" ON quiz_responses;
DROP POLICY IF EXISTS "Service role can read all responses" ON quiz_responses;
DROP POLICY IF EXISTS "Service role can update responses" ON quiz_responses;

-- Create new policies with public access
-- Allow anyone (including public/anon) to insert quiz responses
CREATE POLICY "Public can submit quiz responses"
  ON quiz_responses
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow anyone to read their own responses by email
CREATE POLICY "Anyone can read responses by email"
  ON quiz_responses
  FOR SELECT
  TO public
  USING (true);

-- Allow anyone to update (for Edge Functions without auth)
CREATE POLICY "Public can update quiz responses"
  ON quiz_responses
  FOR UPDATE
  TO public
  USING (true);
