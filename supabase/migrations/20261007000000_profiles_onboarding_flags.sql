-- Migration: add onboarding_flags to profiles
ALTER TABLE profiles
ADD COLUMN onboarding_flags jsonb NOT NULL DEFAULT '{}'::jsonb;
