-- =================================================================
-- SCRIPT PARA APLICAR NO PAINEL DO SUPABASE (SQL EDITOR)
-- Copie e cole este script no SQL Editor do Supabase Dashboard
-- =================================================================

-- 1. FUNCTION TO SYNC PROFILE DATA TO USER METADATA
CREATE OR REPLACE FUNCTION public.sync_user_metadata()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    metadata_update JSONB;
BEGIN
    -- Build metadata object with profile information
    metadata_update := jsonb_build_object(
        'role', NEW.role::TEXT,
        'status', NEW.status::TEXT,
        'verification_status', NEW.verification_status::TEXT,
        'first_name', NEW.first_name,
        'last_name', NEW.last_name,
        'full_name', NEW.full_name,
        'avatar_url', NEW.avatar_url,
        'updated_at', NEW.updated_at::TEXT
    );

    -- Update auth.users raw_user_meta_data
    UPDATE auth.users 
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || metadata_update
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$;

-- 2. CREATE TRIGGER TO SYNC ON PROFILE UPDATES
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_user_metadata_trigger ON public.profiles;

-- Create trigger for profile updates
CREATE TRIGGER sync_user_metadata_trigger
    AFTER INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.sync_user_metadata();

-- 3. ENHANCED JWT CUSTOM ACCESS TOKEN HOOK
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    claims jsonb;
    user_id_val UUID;
    profile_record RECORD;
    user_permissions TEXT[];
BEGIN
    -- Extract user ID from event
    user_id_val := (event->>'user_id')::UUID;
    
    -- Get comprehensive user profile information
    SELECT 
        p.role::TEXT as role,
        p.status::TEXT as status,
        p.verification_status::TEXT as verification_status,
        p.first_name,
        p.last_name,
        p.full_name,
        p.avatar_url,
        p.is_available,
        p.verified_at
    INTO profile_record
    FROM public.profiles p
    WHERE p.id = user_id_val;
    
    -- Get user permissions
    SELECT public.get_user_permissions(user_id_val) INTO user_permissions;
    
    -- Build comprehensive custom claims
    claims := jsonb_build_object(
        'role', COALESCE(profile_record.role, 'pending'),
        'status', COALESCE(profile_record.status, 'pending'),
        'verification_status', COALESCE(profile_record.verification_status, 'pending'),
        'permissions', COALESCE(user_permissions, ARRAY[]::TEXT[]),
        'user_id', user_id_val,
        'first_name', profile_record.first_name,
        'last_name', profile_record.last_name,
        'full_name', profile_record.full_name,
        'avatar_url', profile_record.avatar_url,
        'is_available', COALESCE(profile_record.is_available, false),
        'verified_at', profile_record.verified_at
    );
    
    -- Merge with existing claims
    RETURN jsonb_set(event, '{claims}', (COALESCE(event->'claims', '{}'::jsonb)) || claims);
END;
$$;

-- 4. FUNCTION TO MANUALLY SYNC ALL EXISTING PROFILES
CREATE OR REPLACE FUNCTION public.sync_all_user_metadata()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_record RECORD;
    updated_count INTEGER := 0;
    metadata_update JSONB;
BEGIN
    -- Loop through all profiles and sync their metadata
    FOR profile_record IN 
        SELECT id, role, status, verification_status, first_name, last_name, full_name, avatar_url, updated_at
        FROM public.profiles
    LOOP
        -- Build metadata object
        metadata_update := jsonb_build_object(
            'role', profile_record.role::TEXT,
            'status', profile_record.status::TEXT,
            'verification_status', profile_record.verification_status::TEXT,
            'first_name', profile_record.first_name,
            'last_name', profile_record.last_name,
            'full_name', profile_record.full_name,
            'avatar_url', profile_record.avatar_url,
            'updated_at', profile_record.updated_at::TEXT
        );

        -- Update auth.users raw_user_meta_data
        UPDATE auth.users 
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || metadata_update
        WHERE id = profile_record.id;

        updated_count := updated_count + 1;
    END LOOP;

    RETURN updated_count;
END;
$$;

-- 5. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.sync_user_metadata() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_all_user_metadata() TO authenticated;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;

-- 6. INITIAL SYNC OF EXISTING DATA
SELECT public.sync_all_user_metadata() as profiles_synced;

-- 7. VERIFICATION QUERIES
-- Check if functions were created
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN ('sync_user_metadata', 'sync_all_user_metadata', 'custom_access_token_hook')
AND routine_schema = 'public';

-- Check if trigger was created
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'sync_user_metadata_trigger';

-- Check profiles count
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'pending' THEN 1 END) as pending_users,
    COUNT(CASE WHEN role = 'mentor' THEN 1 END) as mentors,
    COUNT(CASE WHEN role = 'mentee' THEN 1 END) as mentees
FROM public.profiles;