-- =================================================================
-- CREATE MENTOR_VISIBILITY_SETTINGS TABLE - Multi-Tenant System
-- This migration creates the mentor_visibility_settings table for controlling
-- mentor visibility (public vs exclusive to specific organizations)
-- =================================================================

-- Create mentor_visibility_settings table
CREATE TABLE public.mentor_visibility_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  visibility_scope TEXT NOT NULL DEFAULT 'public' CHECK (visibility_scope IN ('public', 'exclusive')),
  
  -- Array of organization IDs where mentor is visible (only used when exclusive)
  visible_to_organizations UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_mentor_visibility_mentor ON public.mentor_visibility_settings(mentor_id);
CREATE INDEX idx_mentor_visibility_scope ON public.mentor_visibility_settings(visibility_scope);

-- Create GIN index for array queries (checking if org is in visible_to_organizations)
CREATE INDEX idx_mentor_visibility_orgs ON public.mentor_visibility_settings USING GIN (visible_to_organizations);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_mentor_visibility_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mentor_visibility_settings_updated_at
  BEFORE UPDATE ON public.mentor_visibility_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_mentor_visibility_settings_updated_at();

-- Add comment to table
COMMENT ON TABLE public.mentor_visibility_settings IS 'Controls mentor visibility - public (visible to all) or exclusive (visible only to specific organizations)';
