-- Fix the enum type issue and add missing columns
DO $$ 
BEGIN
    -- Drop the existing enum if it exists and recreate it
    DROP TYPE IF EXISTS user_role CASCADE;
    CREATE TYPE user_role AS ENUM ('pending', 'mentee', 'mentor', 'admin', 'volunteer', 'moderator');
    
    -- Update profiles table structure
    ALTER TABLE profiles 
    DROP COLUMN IF EXISTS role CASCADE,
    ADD COLUMN role user_role DEFAULT 'pending',
    ADD COLUMN slug TEXT UNIQUE,
    ADD COLUMN address TEXT,
    ADD COLUMN city TEXT,
    ADD COLUMN state TEXT,
    ADD COLUMN country TEXT,
    ADD COLUMN latitude DECIMAL(10, 8),
    ADD COLUMN longitude DECIMAL(11, 8),
    ADD COLUMN portfolio_url TEXT,
    ADD COLUMN personal_website_url TEXT;

    -- Update mentor_profiles table
    ALTER TABLE mentor_profiles 
    DROP COLUMN IF EXISTS languages CASCADE,
    ADD COLUMN languages TEXT[] DEFAULT ARRAY['Português'],
    ADD COLUMN expertise_areas TEXT[] DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN topics TEXT[] DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN inclusion_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN mentorship_approach TEXT,
    ADD COLUMN what_to_expect TEXT,
    ADD COLUMN ideal_mentee TEXT,
    ADD COLUMN cv_url TEXT;

    -- Create function to generate slug
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

    -- Update the user creation trigger to use proper enum
    CREATE OR REPLACE FUNCTION handle_new_user()
    RETURNS TRIGGER AS $$
    DECLARE
        first_name TEXT;
        last_name TEXT;
        full_name TEXT;
        user_type user_role;
        default_role_id UUID;
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

        -- Insert into profiles table
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
            VALUES (NEW.id, ARRAY['Português']);
        END IF;

        -- Assign default role
        SELECT id INTO default_role_id FROM roles WHERE name = user_type::TEXT LIMIT 1;
        
        IF default_role_id IS NOT NULL THEN
            INSERT INTO user_roles (user_id, role_id, is_primary, assigned_at)
            VALUES (NEW.id, default_role_id, TRUE, NOW())
            ON CONFLICT (user_id, role_id) DO NOTHING;
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

    -- Recreate the trigger
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION handle_new_user();

END $$;
