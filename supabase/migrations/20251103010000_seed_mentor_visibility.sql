-- Migration: Seed default visibility settings for existing mentors
-- Description: Create default visibility settings (public) for all existing mentors

-- Insert mentor_visibility_settings records for all existing mentors
-- who don't already have visibility settings
INSERT INTO public.mentor_visibility_settings (
  mentor_id,
  visibility_scope,
  visible_to_organizations,
  created_at,
  updated_at
)
SELECT 
  p.id as mentor_id,
  'public' as visibility_scope,
  '{}' as visible_to_organizations,
  NOW() as created_at,
  NOW() as updated_at
FROM public.profiles p
INNER JOIN public.user_roles ur ON ur.user_id = p.id
INNER JOIN public.roles r ON r.id = ur.role_id
WHERE r.name = 'mentor'
  AND NOT EXISTS (
    SELECT 1 
    FROM public.mentor_visibility_settings mvs 
    WHERE mvs.mentor_id = p.id
  );

-- Log the number of records created
DO $$
DECLARE
  record_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO record_count
  FROM public.mentor_visibility_settings;
  
  RAISE NOTICE 'Total mentor visibility settings: %', record_count;
END $$;
