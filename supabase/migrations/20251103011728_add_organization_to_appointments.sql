-- =================================================================
-- ADD ORGANIZATION_ID TO APPOINTMENTS TABLE - Multi-Tenant System
-- This migration adds organization context to appointments for tracking
-- which organization an appointment belongs to
-- =================================================================

-- Add organization_id column to appointments table (nullable)
ALTER TABLE public.appointments 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Create index for organization-filtered queries
CREATE INDEX idx_appointments_org_id ON public.appointments(organization_id) 
WHERE organization_id IS NOT NULL;

-- Create composite index for common queries (org + scheduled_at)
CREATE INDEX idx_appointments_org_scheduled ON public.appointments(organization_id, scheduled_at) 
WHERE organization_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.appointments.organization_id IS 'Organization context for the appointment - NULL if appointment is not associated with any organization';
