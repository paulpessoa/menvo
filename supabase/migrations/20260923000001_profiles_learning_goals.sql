-- `learning_goals` is written by mentee onboarding (/api/profile/role) and by
-- the /profile form, and read by the admin EditUserModal, but the column was
-- never created. PostgREST rejects the whole UPDATE when the payload has an
-- unknown column, so every profile save and every mentee onboarding failed
-- with 500 ("Could not find the 'learning_goals' column").
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS learning_goals TEXT;

NOTIFY pgrst, 'reload schema';
