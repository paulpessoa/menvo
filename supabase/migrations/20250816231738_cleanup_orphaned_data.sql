-- =================================================================
-- CLEANUP ORPHANED DATA
-- This migration removes orphaned profiles and inconsistent data
-- =================================================================

-- 1. Remove orphaned profiles (profiles without corresponding auth.users)
DELETE FROM public.profiles 
WHERE id NOT IN (SELECT id FROM auth.users);

-- 2. Remove orphaned user_roles
DELETE FROM public.user_roles 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- 3. Remove orphaned validation_requests
DELETE FROM public.validation_requests 
WHERE user_id NOT IN (SELECT id FROM public.profiles);