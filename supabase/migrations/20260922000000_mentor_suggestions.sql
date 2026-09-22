-- Create mentor_suggestions table
CREATE TABLE IF NOT EXISTS mentor_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic TEXT NOT NULL,
    description TEXT,
    email TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'reviewed', 'implemented'))
);

-- Enable RLS
ALTER TABLE mentor_suggestions ENABLE ROW LEVEL SECURITY;

-- Policies
-- Anyone can insert suggestions (anonymous or authenticated)
CREATE POLICY "Anyone can insert suggestions"
    ON mentor_suggestions FOR INSERT
    WITH CHECK (true);

-- Users can read their own suggestions
CREATE POLICY "Users can read own suggestions"
    ON mentor_suggestions FOR SELECT
    USING (auth.uid() = user_id);

-- Admins can read all suggestions
CREATE POLICY "Admins can read all suggestions"
    ON mentor_suggestions FOR SELECT
    USING (public.is_admin());
