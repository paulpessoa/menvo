-- =================================================================
-- CREATE MEMBERSHIP EXPIRATION FUNCTIONS - Multi-Tenant System
-- Functions for automatically expiring memberships and invitations
-- =================================================================

-- Function to expire organization memberships that have passed their expiration date
CREATE OR REPLACE FUNCTION public.expire_organization_memberships()
RETURNS TABLE(
  expired_count INTEGER,
  expired_member_ids UUID[]
) AS $$
DECLARE
  expired_ids UUID[];
  count_expired INTEGER;
BEGIN
  -- Update expired memberships
  WITH updated AS (
    UPDATE public.organization_members
    SET 
      status = 'expired',
      updated_at = NOW()
    WHERE status = 'active' 
      AND expires_at IS NOT NULL 
      AND expires_at < NOW()
    RETURNING id
  )
  SELECT 
    COUNT(*)::INTEGER,
    ARRAY_AGG(id)
  INTO count_expired, expired_ids
  FROM updated;
  
  -- Return results
  RETURN QUERY SELECT count_expired, expired_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire pending invitations that are older than 30 days
CREATE OR REPLACE FUNCTION public.expire_pending_invitations()
RETURNS TABLE(
  expired_count INTEGER,
  expired_invitation_ids UUID[]
) AS $$
DECLARE
  expired_ids UUID[];
  count_expired INTEGER;
BEGIN
  -- Update expired invitations (invited more than 30 days ago)
  WITH updated AS (
    UPDATE public.organization_members
    SET 
      status = 'expired',
      updated_at = NOW()
    WHERE status = 'invited' 
      AND invited_at < NOW() - INTERVAL '30 days'
    RETURNING id
  )
  SELECT 
    COUNT(*)::INTEGER,
    ARRAY_AGG(id)
  INTO count_expired, expired_ids
  FROM updated;
  
  -- Return results
  RETURN QUERY SELECT count_expired, expired_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get memberships expiring soon (within next 7 days)
CREATE OR REPLACE FUNCTION public.get_expiring_memberships(days_ahead INTEGER DEFAULT 7)
RETURNS TABLE(
  id UUID,
  organization_id UUID,
  organization_name TEXT,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  role TEXT,
  expires_at TIMESTAMPTZ,
  days_until_expiration INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    om.id,
    om.organization_id,
    o.name AS organization_name,
    om.user_id,
    p.email AS user_email,
    p.full_name AS user_name,
    om.role,
    om.expires_at,
    EXTRACT(DAY FROM (om.expires_at - NOW()))::INTEGER AS days_until_expiration
  FROM public.organization_members om
  JOIN public.organizations o ON o.id = om.organization_id
  JOIN public.profiles p ON p.id = om.user_id
  WHERE om.status = 'active'
    AND om.expires_at IS NOT NULL
    AND om.expires_at > NOW()
    AND om.expires_at <= NOW() + (days_ahead || ' days')::INTERVAL
  ORDER BY om.expires_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION public.expire_organization_memberships IS 'Expires active memberships that have passed their expiration date - should be called by cron job';
COMMENT ON FUNCTION public.expire_pending_invitations IS 'Expires pending invitations older than 30 days - should be called by cron job';
COMMENT ON FUNCTION public.get_expiring_memberships IS 'Returns memberships expiring within specified days (default 7) for notification purposes';
