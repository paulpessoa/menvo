-- Fix the profiles table structure completely
BEGIN;

-- First, let's check if the enum exists and create it if not
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('pending', 'mentee', 'mentor', 'admin', 'volunteer', 'moderator');
    END IF;
END $$;

-- Drop the problematic role column if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles DROP COLUMN role CASCADE;
    END IF;
END $$;

-- Add the role column with proper enum type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'pending'::user_role;
    END IF;
END $$;

-- Add missing columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'slug') THEN
        ALTER TABLE profiles ADD COLUMN slug TEXT UNIQUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'address') THEN
        ALTER TABLE profiles ADD COLUMN address TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'city') THEN
        ALTER TABLE profiles ADD COLUMN city TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'state') THEN
        ALTER TABLE profiles ADD COLUMN state TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'country') THEN
        ALTER TABLE profiles ADD COLUMN country TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'latitude') THEN
        ALTER TABLE profiles ADD COLUMN latitude DECIMAL(10, 8);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'longitude') THEN
        ALTER TABLE profiles ADD COLUMN longitude DECIMAL(11, 8);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'portfolio_url') THEN
        ALTER TABLE profiles ADD COLUMN portfolio_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'personal_website_url') THEN
        ALTER TABLE profiles ADD COLUMN personal_website_url TEXT;
    END IF;
END $$;

-- Create mentor_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS mentor_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    languages TEXT[] DEFAULT ARRAY['Português'],
    expertise_areas TEXT[] DEFAULT ARRAY[]::TEXT[],
    topics TEXT[] DEFAULT ARRAY[]::TEXT[],
    inclusion_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    mentorship_approach TEXT,
    what_to_expect TEXT,
    ideal_mentee TEXT,
    cv_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update mentor_profiles table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mentor_profiles') THEN
        -- Drop languages column if it exists with wrong type
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mentor_profiles' AND column_name = 'languages' AND data_type != 'ARRAY') THEN
            ALTER TABLE mentor_profiles DROP COLUMN languages CASCADE;
        END IF;

        -- Add columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mentor_profiles' AND column_name = 'languages') THEN
            ALTER TABLE mentor_profiles ADD COLUMN languages TEXT[] DEFAULT ARRAY['Português'];
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mentor_profiles' AND column_name = 'expertise_areas') THEN
            ALTER TABLE mentor_profiles ADD COLUMN expertise_areas TEXT[] DEFAULT ARRAY[]::TEXT[];
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mentor_profiles' AND column_name = 'topics') THEN
            ALTER TABLE mentor_profiles ADD COLUMN topics TEXT[] DEFAULT ARRAY[]::TEXT[];
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mentor_profiles' AND column_name = 'inclusion_tags') THEN
            ALTER TABLE mentor_profiles ADD COLUMN inclusion_tags TEXT[] DEFAULT ARRAY[]::TEXT[];
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mentor_profiles' AND column_name = 'mentorship_approach') THEN
            ALTER TABLE mentor_profiles ADD COLUMN mentorship_approach TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mentor_profiles' AND column_name = 'what_to_expect') THEN
            ALTER TABLE mentor_profiles ADD COLUMN what_to_expect TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mentor_profiles' AND column_name = 'ideal_mentee') THEN
            ALTER TABLE mentor_profiles ADD COLUMN ideal_mentee TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mentor_profiles' AND column_name = 'cv_url') THEN
            ALTER TABLE mentor_profiles ADD COLUMN cv_url TEXT;
        END IF;
    END IF;
END $$;

-- Create or replace the slug generation function
CREATE OR REPLACE FUNCTION generate_profile_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Generate base slug from full_name
    base_slug := LOWER(REGEXP_REPLACE(
        COALESCE(NEW.full_name, NEW.first_name || ' ' || NEW.last_name, 'user'), 
        '[^a-zA-Z0-9]+', '-', 'g'
    ));
    base_slug := TRIM(base_slug, '-');
    
    -- If slug is not provided, generate one
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        final_slug := base_slug;
        
        -- Check for uniqueness and add counter if needed
        WHILE EXISTS (SELECT 1 FROM profiles WHERE slug = final_slug AND id != NEW.id) LOOP
            counter := counter + 1;
            final_slug := base_slug || '-' || counter;
        END LOOP;
        
        NEW.slug := final_slug;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for slug generation
DROP TRIGGER IF EXISTS generate_profile_slug_trigger ON profiles;
CREATE TRIGGER generate_profile_slug_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION generate_profile_slug();

-- Create or replace the user creation trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    first_name TEXT;
    last_name TEXT;
    full_name TEXT;
    user_type user_role;
BEGIN
    -- Extract user metadata
    IF NEW.raw_user_meta_data IS NULL THEN
        first_name := 'Unknown';
        last_name := 'User';
        full_name := 'Unknown User';
        user_type := 'pending'::user_role;
    ELSE
        first_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'first_name', ''), 
                              NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'Unknown');
        last_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'last_name', ''), 'User');
        full_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 
                             CONCAT(first_name, ' ', last_name));
        
        -- Convert user_type to proper enum
        CASE COALESCE(NULLIF(NEW.raw_user_meta_data->>'user_type', ''), 'pending')
            WHEN 'mentor' THEN user_type := 'mentor'::user_role;
            WHEN 'mentee' THEN user_type := 'mentee'::user_role;
            WHEN 'volunteer' THEN user_type := 'volunteer'::user_role;
            ELSE user_type := 'pending'::user_role;
        END CASE;
    END IF;

    -- Insert into profiles table with proper enum casting
    INSERT INTO profiles (
        id, 
        email, 
        first_name, 
        last_name, 
        full_name, 
        role,
        status,
        verification_status,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        first_name,
        last_name,
        full_name,
        user_type,
        'pending',
        'pending',
        NOW(),
        NOW()
    );

    -- Create mentor profile if user is mentor
    IF user_type = 'mentor'::user_role THEN
        INSERT INTO mentor_profiles (user_id, languages)
        VALUES (NEW.id, ARRAY['Português'])
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update existing records to have proper role values
UPDATE profiles SET role = 'pending'::user_role WHERE role IS NULL;

COMMIT;
