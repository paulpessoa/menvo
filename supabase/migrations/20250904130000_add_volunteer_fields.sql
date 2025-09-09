-- Add volunteer-related fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_volunteer BOOLEAN DEFAULT FALSE;

-- Create volunteer_activities table for tracking volunteer work
CREATE TABLE IF NOT EXISTS volunteer_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'mentoria', 'workshop', 'palestra', 'codigo', 'design', 
    'marketing', 'administracao', 'suporte', 'traducao', 'outro'
  )),
  description TEXT,
  hours DECIMAL(4,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
  date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected')),
  validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  validated_at TIMESTAMP WITH TIME ZONE,
  validation_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_volunteer_activities_user_id ON volunteer_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_activities_status ON volunteer_activities(status);
CREATE INDEX IF NOT EXISTS idx_volunteer_activities_date ON volunteer_activities(date DESC);
CREATE INDEX IF NOT EXISTS idx_volunteer_activities_type ON volunteer_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_profiles_is_volunteer ON profiles(is_volunteer);

-- Enable RLS on volunteer_activities
ALTER TABLE volunteer_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for volunteer_activities
-- Users can insert their own activities
CREATE POLICY "Users can insert own volunteer activities" ON volunteer_activities
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own activities
CREATE POLICY "Users can view own volunteer activities" ON volunteer_activities
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can update their own pending activities
CREATE POLICY "Users can update own pending activities" ON volunteer_activities
  FOR UPDATE 
  USING (auth.uid() = user_id AND status = 'pending');

-- Admins and volunteers can view all activities
CREATE POLICY "Volunteers and admins can view all activities" ON volunteer_activities
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('admin', 'volunteer')
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.is_volunteer = true
    )
  );

-- Admins can validate activities
CREATE POLICY "Admins can validate activities" ON volunteer_activities
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name = 'admin'
    )
  );

-- Create updated_at trigger for volunteer_activities
CREATE OR REPLACE FUNCTION update_volunteer_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER volunteer_activities_updated_at
  BEFORE UPDATE ON volunteer_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_volunteer_activities_updated_at();

-- Update existing mentors to be volunteers
UPDATE profiles 
SET is_volunteer = true 
WHERE id IN (
  SELECT ur.user_id 
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE r.name IN ('admin', 'mentor')
);
