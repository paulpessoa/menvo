-- Create quiz_responses table
CREATE TABLE IF NOT EXISTS quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contact information
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  linkedin_url TEXT,
  
  -- Quiz responses
  career_moment TEXT NOT NULL,
  mentorship_experience TEXT NOT NULL,
  development_areas TEXT[] NOT NULL,
  current_challenge TEXT,
  future_vision TEXT,
  share_knowledge TEXT,
  personal_life_help TEXT,
  
  -- AI Analysis results
  ai_analysis JSONB,
  score INTEGER CHECK (score >= 0 AND score <= 1000),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX idx_quiz_responses_email ON quiz_responses(email);
CREATE INDEX idx_quiz_responses_created_at ON quiz_responses(created_at DESC);
CREATE INDEX idx_quiz_responses_score ON quiz_responses(score);

-- Create mentors table for matching
CREATE TABLE IF NOT EXISTS quiz_mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Mentor information
  name TEXT NOT NULL,
  specialties TEXT[] NOT NULL,
  areas TEXT[] NOT NULL,
  bio TEXT,
  
  -- Availability
  is_available BOOLEAN DEFAULT TRUE,
  max_mentees INTEGER DEFAULT 5,
  current_mentees INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for specialty matching
CREATE INDEX idx_quiz_mentors_specialties ON quiz_mentors USING GIN(specialties);
CREATE INDEX idx_quiz_mentors_areas ON quiz_mentors USING GIN(areas);
CREATE INDEX idx_quiz_mentors_available ON quiz_mentors(is_available);

-- Enable RLS
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_mentors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quiz_responses
-- Allow anyone to insert (public quiz)
CREATE POLICY "Anyone can submit quiz responses"
  ON quiz_responses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow users to read their own responses
CREATE POLICY "Users can read their own responses"
  ON quiz_responses
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- Allow service role to read all (for Edge Functions)
CREATE POLICY "Service role can read all responses"
  ON quiz_responses
  FOR SELECT
  TO service_role
  USING (true);

-- Allow service role to update (for AI processing)
CREATE POLICY "Service role can update responses"
  ON quiz_responses
  FOR UPDATE
  TO service_role
  USING (true);

-- RLS Policies for quiz_mentors
-- Allow anyone to read available mentors
CREATE POLICY "Anyone can read available mentors"
  ON quiz_mentors
  FOR SELECT
  TO anon, authenticated
  USING (is_available = true);

-- Allow service role full access
CREATE POLICY "Service role has full access to mentors"
  ON quiz_mentors
  FOR ALL
  TO service_role
  USING (true);

-- Seed initial mentors data (current 5 mentors from platform)
INSERT INTO quiz_mentors (name, specialties, areas, bio, is_available, max_mentees) VALUES
  (
    'Mentor de Tecnologia',
    ARRAY['Desenvolvimento de Software', 'Carreira em Tech', 'Programação'],
    ARRAY['Desenvolvimento técnico', 'Planejamento de carreira'],
    'Especialista em desenvolvimento de software com 10+ anos de experiência.',
    true,
    5
  ),
  (
    'Mentor de Liderança',
    ARRAY['Gestão de Pessoas', 'Liderança', 'Soft Skills'],
    ARRAY['Liderança e gestão', 'Comunicação e networking'],
    'Líder com experiência em gestão de equipes e desenvolvimento de líderes.',
    true,
    5
  ),
  (
    'Mentor de Carreira',
    ARRAY['Planejamento de Carreira', 'Transição de Carreira', 'Networking'],
    ARRAY['Planejamento de carreira', 'Comunicação e networking'],
    'Especialista em orientação profissional e transições de carreira.',
    true,
    5
  ),
  (
    'Mentor de Empreendedorismo',
    ARRAY['Startups', 'Negócios', 'Inovação'],
    ARRAY['Empreendedorismo', 'Planejamento de carreira'],
    'Empreendedor serial com experiência em startups e inovação.',
    true,
    3
  ),
  (
    'Mentor de Desenvolvimento Pessoal',
    ARRAY['Soft Skills', 'Inteligência Emocional', 'Produtividade'],
    ARRAY['Equilíbrio vida pessoal/profissional', 'Comunicação e networking'],
    'Coach especializado em desenvolvimento pessoal e bem-estar profissional.',
    true,
    5
  );

-- Add comment to tables
COMMENT ON TABLE quiz_responses IS 'Stores responses from RecnPlay quiz participants';
COMMENT ON TABLE quiz_mentors IS 'Stores available mentors for matching with quiz participants';
