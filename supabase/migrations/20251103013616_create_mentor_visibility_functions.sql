-- =================================================================
-- CREATE MENTOR VISIBILITY FUNCTIONS - Multi-Tenant System
-- Functions for determining which mentors are visible to which users
-- =================================================================

-- Function to get all mentor IDs visible to a specific user
CREATE OR REPLACE FUNCTION public.get_visible_mentor_ids(p_user_id UUID)
RETURNS TABLE(mentor_id UUID) AS $$
BEGIN
  RETURN QUERY
  -- Public mentors (always visible to everyone)
  SELECT mvs.mentor_id
  FROM public.mentor_visibility_settings mvs
  WHERE mvs.visibility_scope = 'public'
  
  UNION
  
  -- Exclusive mentors visible to user's organizations
  SELECT mvs.mentor_id
  FROM public.mentor_visibility_settings mvs
  WHERE mvs.visibility_scope = 'exclusive'
    AND EXISTS (
      -- User must be an active member of at least one organization
      -- where the mentor is visible
      SELECT 1 
      FROM public.organization_members om
      WHERE om.user_id = p_user_id
        AND om.status = 'active'
        AND om.organization_id = ANY(mvs.visible_to_organizations)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop existing function if it exists with different signature
DROP FUNCTION IF EXISTS public.is_mentor_visible_to_user(UUID, UUID);

-- Function to check if a specific mentor is visible to a specific user
CREATE FUNCTION public.is_mentor_visible_to_user(
  p_mentor_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  mentor_scope TEXT;
  mentor_orgs UUID[];
BEGIN
  -- Get mentor's visibility settings
  SELECT visibility_scope, visible_to_organizations
  INTO mentor_scope, mentor_orgs
  FROM public.mentor_visibility_settings
  WHERE mentor_id = p_mentor_id;
  
  -- If no settings found, default to public (for backward compatibility)
  IF mentor_scope IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Public mentors are visible to everyone
  IF mentor_scope = 'public' THEN
    RETURN TRUE;
  END IF;
  
  -- Exclusive mentors: check if user is member of any visible organization
  IF mentor_scope = 'exclusive' THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.user_id = p_user_id
        AND om.status = 'active'
        AND om.organization_id = ANY(mentor_orgs)
    );
  END IF;
  
  -- Default: not visible
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop existing function if it exists with different signature
DROP FUNCTION IF EXISTS public.get_mentors_by_organization(UUID, UUID);

-- Function to get mentors filtered by organization
CREATE FUNCTION public.get_mentors_by_organization(
  p_organization_id UUID,
  p_user_id UUID DEFAULT NULL
) RETURNS TABLE(mentor_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT om.user_id
  FROM public.organization_members om
  WHERE om.organization_id = p_organization_id
    AND om.role = 'mentor'
    AND om.status = 'active'
    AND (
      -- If user_id provided, check visibility
      p_user_id IS NULL 
      OR public.is_mentor_visible_to_user(om.user_id, p_user_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get all organizations where a mentor is visible
CREATE OR REPLACE FUNCTION public.get_mentor_visible_organizations(p_mentor_id UUID)
RETURNS TABLE(
  organization_id UUID,
  organization_name TEXT,
  organization_type TEXT
) AS $$
DECLARE
  mentor_scope TEXT;
  mentor_orgs UUID[];
BEGIN
  -- Get mentor's visibility settings
  SELECT visibility_scope, visible_to_organizations
  INTO mentor_scope, mentor_orgs
  FROM public.mentor_visibility_settings
  WHERE mentor_id = p_mentor_id;
  
  -- If public, return all active organizations
  IF mentor_scope = 'public' OR mentor_scope IS NULL THEN
    RETURN QUERY
    SELECT o.id, o.name, o.type
    FROM public.organizations o
    WHERE o.status = 'active'
    ORDER BY o.name;
  
  -- If exclusive, return only specified organizations
  ELSIF mentor_scope = 'exclusive' THEN
    RETURN QUERY
    SELECT o.id, o.name, o.type
    FROM public.organizations o
    WHERE o.id = ANY(mentor_orgs)
      AND o.status = 'active'
    ORDER BY o.name;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Add comments
COMMENT ON FUNCTION public.get_visible_mentor_ids IS 'Returns all mentor IDs visible to a specific user based on visibility settings and organization memberships';
COMMENT ON FUNCTION public.is_mentor_visible_to_user IS 'Checks if a specific mentor is visible to a specific user';
COMMENT ON FUNCTION public.get_mentors_by_organization IS 'Returns mentors associated with a specific organization, optionally filtered by user visibility';
COMMENT ON FUNCTION public.get_mentor_visible_organizations IS 'Returns all organizations where a mentor is visible';
