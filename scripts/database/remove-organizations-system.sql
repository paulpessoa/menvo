-- Remove Organizations System Completely
-- This script removes all tables, views, functions, and policies related to organizations
-- IMPORTANT: This does NOT delete any users or user data, only organization structures

-- 1. Drop views that depend on organizations
DROP VIEW IF EXISTS mentors_view CASCADE;

-- 2. Drop organization-related tables
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- 3. Remove organization_ids column from profiles if it exists
ALTER TABLE profiles DROP COLUMN IF EXISTS organization_ids CASCADE;

-- 4. Recreate mentors_view WITHOUT organization references
CREATE OR REPLACE VIEW mentors_view AS
SELECT
  p.id,
  p.full_name,
  p.avatar_url,
  p.bio,
  p.job_title,
  p.company,
  p.city,
  p.state,
  p.country,
  p.languages,
  p.mentorship_topics,
  p.inclusive_tags,
  p.expertise_areas,
  p.session_price_usd,
  p.availability_status,
  p.average_rating,
  p.total_reviews,
  p.total_sessions,
  p.experience_years,
  p.slug,
  p.created_at,
  p.updated_at
FROM profiles p
WHERE p.role = 'mentor'
  AND p.is_mentor_profile_complete = true
  AND p.mentor_verification_status = 'approved';

-- 5. Grant permissions on the new view
GRANT SELECT ON mentors_view TO authenticated;
GRANT SELECT ON mentors_view TO anon;

-- 6. Clean up any organization-related functions
DROP FUNCTION IF EXISTS get_user_organizations(uuid) CASCADE;
DROP FUNCTION IF EXISTS check_organization_admin(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS get_organization_members(uuid) CASCADE;

-- 7. Remove organization-related columns from other tables if they exist
-- (Add more ALTER TABLE statements here if you find other tables with organization references)

COMMENT ON VIEW mentors_view IS 'Simplified mentors view without organization system';

-- Made with Bob
