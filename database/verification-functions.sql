-- Function to request mentor verification
CREATE OR REPLACE FUNCTION request_mentor_verification(mentor_user_id UUID)
RETURNS UUID AS $$
DECLARE
  mentor_record RECORD;
  verification_id UUID;
BEGIN
  -- Check if user is a mentor
  SELECT * INTO mentor_record FROM mentors WHERE user_id = mentor_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User is not a mentor';
  END IF;
  
  -- Check if mentor is in correct status
  IF mentor_record.status != 'pending_verification' THEN
    RAISE EXCEPTION 'Mentor is not in pending verification status';
  END IF;
  
  -- Create verification record
  INSERT INTO mentor_verification (mentor_id, verification_type, status)
  VALUES (mentor_record.id, 'initial', 'pending')
  RETURNING id INTO verification_id;
  
  RETURN verification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to schedule verification (admin only)
CREATE OR REPLACE FUNCTION schedule_mentor_verification(
  verification_id UUID,
  scheduled_datetime TIMESTAMPTZ,
  admin_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin(admin_id) THEN
    RAISE EXCEPTION 'Only admins can schedule verifications';
  END IF;
  
  -- Update verification record
  UPDATE mentor_verification 
  SET 
    status = 'scheduled',
    scheduled_at = scheduled_datetime,
    updated_at = NOW()
  WHERE id = verification_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification not found or not in pending status';
  END IF;
  
  -- Update mentor status
  UPDATE mentors 
  SET status = 'verification_scheduled'
  WHERE id = (SELECT mentor_id FROM mentor_verification WHERE id = verification_id);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete verification (admin only)
CREATE OR REPLACE FUNCTION complete_mentor_verification(
  verification_id UUID,
  admin_id UUID,
  verification_passed BOOLEAN,
  verification_notes TEXT DEFAULT NULL,
  documents_ok BOOLEAN DEFAULT TRUE,
  identity_ok BOOLEAN DEFAULT TRUE,
  expertise_ok BOOLEAN DEFAULT TRUE,
  background_ok BOOLEAN DEFAULT TRUE
)
RETURNS BOOLEAN AS $$
DECLARE
  mentor_id_var UUID;
  mentor_user_id UUID;
BEGIN
  -- Check if user is admin
  IF NOT is_admin(admin_id) THEN
    RAISE EXCEPTION 'Only admins can complete verifications';
  END IF;
  
  -- Get mentor info
  SELECT mentor_id INTO mentor_id_var 
  FROM mentor_verification 
  WHERE id = verification_id;
  
  SELECT user_id INTO mentor_user_id 
  FROM mentors 
  WHERE id = mentor_id_var;
  
  IF verification_passed THEN
    -- Update verification record as completed
    UPDATE mentor_verification 
    SET 
      status = 'completed',
      completed_at = NOW(),
      verified_by = admin_id,
      notes = verification_notes,
      documents_submitted = documents_ok,
      identity_verified = identity_ok,
      expertise_verified = expertise_ok,
      background_check = background_ok,
      updated_at = NOW()
    WHERE id = verification_id;
    
    -- Update mentor status to verified
    UPDATE mentors 
    SET 
      status = 'verified',
      verified_at = NOW(),
      verified_by = admin_id,
      verification_notes = verification_notes
    WHERE id = mentor_id_var;
    
    -- Update user profile to active
    UPDATE profiles 
    SET status = 'active'
    WHERE id = mentor_user_id;
    
  ELSE
    -- Update verification record as rejected
    UPDATE mentor_verification 
    SET 
      status = 'rejected',
      completed_at = NOW(),
      verified_by = admin_id,
      notes = verification_notes,
      rejection_reason = verification_notes,
      updated_at = NOW()
    WHERE id = verification_id;
    
    -- Update mentor status to rejected
    UPDATE mentors 
    SET 
      status = 'rejected',
      verification_notes = verification_notes
    WHERE id = mentor_id_var;
  END IF;
  
  -- Log admin action
  INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details, reason)
  VALUES (
    admin_id,
    CASE WHEN verification_passed THEN 'mentor_verified' ELSE 'mentor_rejected' END,
    'mentor',
    mentor_id_var,
    jsonb_build_object(
      'verification_id', verification_id,
      'documents_submitted', documents_ok,
      'identity_verified', identity_ok,
      'expertise_verified', expertise_ok,
      'background_check', background_ok
    ),
    verification_notes
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending verifications (admin only)
CREATE OR REPLACE FUNCTION get_pending_verifications(admin_id UUID)
RETURNS TABLE (
  verification_id UUID,
  mentor_id UUID,
  mentor_name TEXT,
  mentor_email TEXT,
  mentor_title TEXT,
  mentor_company TEXT,
  verification_type TEXT,
  status verification_status,
  created_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin(admin_id) THEN
    RAISE EXCEPTION 'Only admins can view pending verifications';
  END IF;
  
  RETURN QUERY
  SELECT 
    mv.id,
    m.id,
    p.full_name,
    p.email,
    m.title,
    m.company,
    mv.verification_type,
    mv.status,
    mv.created_at,
    mv.scheduled_at
  FROM mentor_verification mv
  JOIN mentors m ON mv.mentor_id = m.id
  JOIN profiles p ON m.user_id = p.id
  WHERE mv.status IN ('pending', 'scheduled')
  ORDER BY mv.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
