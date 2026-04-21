-- =================================================================
-- PREPARE FOR JOTFORM IMPORT
-- Add tracking and metadata columns for external imports
-- =================================================================

-- 1. Ensure Organization exists
INSERT INTO public.organizations (name, slug, verified)
VALUES ('Estágio Recife', 'estagio-recife', true)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- 2. Add tracking columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS origin_platform TEXT DEFAULT 'menvo';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS original_data JSONB;

-- 3. Create indices for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_external_id ON public.profiles(external_id);
CREATE INDEX IF NOT EXISTS idx_profiles_origin_platform ON public.profiles(origin_platform);
