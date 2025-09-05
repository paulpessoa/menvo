-- =================================================================
-- TEST RLS POLICIES - Auth Refactor MVP
-- Test script to validate Row Level Security policies
-- =================================================================

-- This script should be run in Supabase SQL editor or via psql
-- to test that RLS policies work correctly

-- =================================================================
-- 1. CREATE TEST USERS (Run as service_role)
-- =================================================================

-- Note: In production, users would be created via Supabase Auth
-- This is just for testing the database policies

-- Test user 1: Regular mentee
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'mentee@test.com',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Test user 2: Verified mentor
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'mentor@test.com',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Test user 3: Admin
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'admin@test.com',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Test user 4: Unverified mentor
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'unverified@test.com',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- =================================================================
-- 2. SET UP TEST DATA
-- =================================================================

-- Profiles will be created automatically by trigger
-- Update profiles with test data
UPDATE public.profiles 
SET first_name = 'Test', last_name = 'Mentee', verified = false
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE public.profiles 
SET first_name = 'Test', last_name = 'Mentor', verified = true
WHERE id = '22222222-2222-2222-2222-222222222222';

UPDATE public.profiles 
SET first_name = 'Test', last_name = 'Admin', verified = true
WHERE id = '33333333-3333-3333-3333-333333333333';

UPDATE public.profiles 
SET first_name = 'Unverified', last_name = 'Mentor', verified = false
WHERE id = '44444444-4444-4444-4444-444444444444';

-- Assign roles
INSERT INTO public.user_roles (user_id, role_id)
SELECT '11111111-1111-1111-1111-111111111111', id FROM public.roles WHERE name = 'mentee'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role_id)
SELECT '22222222-2222-2222-2222-222222222222', id FROM public.roles WHERE name = 'mentor'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role_id)
SELECT '33333333-3333-3333-3333-333333333333', id FROM public.roles WHERE name = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role_id)
SELECT '44444444-4444-4444-4444-444444444444', id FROM public.roles WHERE name = 'mentor'
ON CONFLICT DO NOTHING;

-- Add mentor availability for verified mentor
INSERT INTO public.mentor_availability (mentor_id, day_of_week, start_time, end_time)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 1, '09:00', '17:00'),
  ('22222222-2222-2222-2222-222222222222', 3, '09:00', '17:00');

-- Add mentor availability for unverified mentor
INSERT INTO public.mentor_availability (mentor_id, day_of_week, start_time, end_time)
VALUES 
  ('44444444-4444-4444-4444-444444444444', 2, '10:00', '16:00');

-- =================================================================
-- 3. TEST QUERIES (Run with different auth.uid() values)
-- =================================================================

-- Test 1: Anonymous user should only see verified mentors
-- SET LOCAL auth.uid TO NULL;
-- SELECT id, email, first_name, verified FROM public.profiles;
-- Expected: Only verified mentor should be visible

-- Test 2: Mentee should see own profile + verified mentors
-- SET LOCAL auth.uid TO '11111111-1111-1111-1111-111111111111';
-- SELECT id, email, first_name, verified FROM public.profiles;
-- Expected: Own profile + verified mentor

-- Test 3: Verified mentor should see own profile + other verified mentors
-- SET LOCAL auth.uid TO '22222222-2222-2222-2222-222222222222';
-- SELECT id, email, first_name, verified FROM public.profiles;
-- Expected: Own profile + other verified mentors

-- Test 4: Admin should see all profiles
-- SET LOCAL auth.uid TO '33333333-3333-3333-3333-333333333333';
-- SELECT id, email, first_name, verified FROM public.profiles;
-- Expected: All profiles

-- Test 5: Test mentor availability visibility
-- SET LOCAL auth.uid TO NULL;
-- SELECT ma.*, p.first_name, p.verified 
-- FROM public.mentor_availability ma
-- JOIN public.profiles p ON ma.mentor_id = p.id;
-- Expected: Only availability for verified mentors

-- =================================================================
-- 4. CLEANUP TEST DATA (Optional)
-- =================================================================

-- Uncomment to clean up test data
-- DELETE FROM public.appointments WHERE mentor_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');
-- DELETE FROM public.mentor_availability WHERE mentor_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');
-- DELETE FROM public.user_roles WHERE user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');
-- DELETE FROM public.profiles WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');
-- DELETE FROM auth.users WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');