-- =================================================================
-- CREATE ORGANIZATIONS TABLE - Multi-Tenant System
-- This migration creates the core organizations table for the multi-tenant feature
-- =================================================================

-- Create organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('company', 'ngo', 'hackathon', 'sebrae', 'community', 'other')),
  description TEXT,
  logo_url TEXT,
  website TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'active', 'suspended', 'inactive')),
  
  -- Quotas for monetization (NULL = unlimited)
  max_mentors INTEGER DEFAULT NULL,
  max_mentees INTEGER DEFAULT NULL,
  max_monthly_appointments INTEGER DEFAULT NULL,
  
  -- Approval tracking
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_status ON public.organizations(status);
CREATE INDEX idx_organizations_type ON public.organizations(type);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_organizations_updated_at();

-- Add comment to table
COMMENT ON TABLE public.organizations IS 'Organizations that manage mentors and mentees in the multi-tenant system';
