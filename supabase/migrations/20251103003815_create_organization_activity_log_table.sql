-- =================================================================
-- CREATE ORGANIZATION_ACTIVITY_LOG TABLE - Multi-Tenant System
-- This migration creates the organization_activity_log table for tracking
-- important activities within organizations (audit trail and activity feed)
-- =================================================================

-- Create organization_activity_log table
CREATE TABLE public.organization_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'member_joined',
    'member_left',
    'member_invited',
    'appointment_created',
    'appointment_completed',
    'appointment_cancelled',
    'organization_created',
    'organization_approved',
    'settings_updated'
  )),
  
  -- Who performed the action (can be NULL for system actions)
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Who was affected by the action (can be NULL for non-user actions)
  target_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Additional context as JSON (appointment_id, old_values, new_values, etc)
  metadata JSONB,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_org_activity_org_id ON public.organization_activity_log(organization_id);
CREATE INDEX idx_org_activity_created ON public.organization_activity_log(created_at DESC);
CREATE INDEX idx_org_activity_type ON public.organization_activity_log(activity_type);

-- Create composite index for common queries (org + date range)
CREATE INDEX idx_org_activity_org_created ON public.organization_activity_log(organization_id, created_at DESC);

-- Create GIN index for metadata queries
CREATE INDEX idx_org_activity_metadata ON public.organization_activity_log USING GIN (metadata);

-- Add comment to table
COMMENT ON TABLE public.organization_activity_log IS 'Audit trail and activity feed for organizations - tracks important events and changes';
