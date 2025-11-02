-- =================================================================
-- CREATE ORGANIZATION_MEMBERS TABLE - Multi-Tenant System
-- This migration creates the organization_members table for managing
-- relationships between users and organizations
-- =================================================================

-- Create organization_members table
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'mentor', 'mentee')),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'declined', 'left', 'expired', 'cancelled')),
  
  -- Invitation management
  invitation_token TEXT UNIQUE,
  invited_by UUID REFERENCES public.profiles(id),
  invited_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Lifecycle dates
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- NULL = no expiration
  left_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure unique combination of organization, user, and role
  UNIQUE(organization_id, user_id, role)
);

-- Create indexes for performance
CREATE INDEX idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_org_members_status ON public.organization_members(status);
CREATE INDEX idx_org_members_token ON public.organization_members(invitation_token) WHERE invitation_token IS NOT NULL;
CREATE INDEX idx_org_members_expires ON public.organization_members(expires_at) WHERE expires_at IS NOT NULL;

-- Create composite index for common queries
CREATE INDEX idx_org_members_org_status ON public.organization_members(organization_id, status);
CREATE INDEX idx_org_members_user_status ON public.organization_members(user_id, status);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_organization_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_organization_members_updated_at
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_organization_members_updated_at();

-- Add comment to table
COMMENT ON TABLE public.organization_members IS 'Manages relationships between users and organizations with invitation workflow';
