-- Create waiting_list table for managing user waiting list
CREATE TABLE IF NOT EXISTS waiting_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  whatsapp TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_waiting_list_email ON waiting_list(email);
CREATE INDEX IF NOT EXISTS idx_waiting_list_status ON waiting_list(status);
CREATE INDEX IF NOT EXISTS idx_waiting_list_created_at ON waiting_list(created_at DESC);

-- Enable RLS
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can insert into waiting list (for registration)
CREATE POLICY "Anyone can join waiting list" ON waiting_list
  FOR INSERT 
  WITH CHECK (true);

-- Users can view their own waiting list entry
CREATE POLICY "Users can view own waiting list entry" ON waiting_list
  FOR SELECT 
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Admins can view all waiting list entries
CREATE POLICY "Admins can view all waiting list entries" ON waiting_list
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name = 'admin'
    )
  );

-- Admins can update waiting list entries (for approval/rejection)
CREATE POLICY "Admins can update waiting list entries" ON waiting_list
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name = 'admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_waiting_list_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER waiting_list_updated_at
  BEFORE UPDATE ON waiting_list
  FOR EACH ROW
  EXECUTE FUNCTION update_waiting_list_updated_at();