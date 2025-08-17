-- =================================================================
-- MENVO - ADD FUNCTIONS AND TRIGGERS
-- This migration adds the essential functions and triggers to the database
-- =================================================================

-- =================================================================
-- 1. UTILITY FUNCTIONS
-- =================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Function to generate unique profile slug
CREATE OR REPLACE FUNCTION public.generate_profile_slug()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Only generate slug if not provided or empty
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        -- Generate base slug from full_name or email
        base_slug := LOWER(REGEXP_REPLACE(
            COALESCE(
                NULLIF(TRIM(NEW.first_name || ' ' || NEW.last_name), ''),
                SPLIT_PART(NEW.email, '@', 1)
            ), 
            '[^a-zA-Z0-9]+', '-', 'g'
        ));
        base_slug := TRIM(base_slug, '-');
        
        -- Ensure uniqueness
        final_slug := base_slug;
        WHILE EXISTS (SELECT 1 FROM public.profiles WHERE slug = final_slug AND id != NEW.id) LOOP
            counter := counter + 1;
            final_slug := base_slug || '-' || counter;
        END LOOP;
        
        NEW.slug := final_slug;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Function to get user permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_uuid UUID)
RETURNS TEXT[] 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_permissions TEXT[];
BEGIN
    SELECT ARRAY_AGG(DISTINCT p.name) INTO user_permissions
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_uuid;
    
    RETURN COALESCE(user_permissions, ARRAY[]::TEXT[]);
END;
$$;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(user_uuid UUID, permission_name TEXT)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    has_permission BOOLEAN := false;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM public.user_roles ur
        JOIN public.role_permissions rp ON ur.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = user_uuid 
        AND p.name = permission_name
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$;

-- =================================================================
-- 2. MAIN TRIGGER FUNCTION FOR USER REGISTRATION
-- =================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_metadata JSONB;
    first_name_val TEXT;
    last_name_val TEXT;
    user_type_val TEXT;
    user_role_val public.user_role;
    verification_status_val public.verification_status;
    role_record RECORD;
BEGIN
    -- Extract metadata
    user_metadata := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
    
    -- Extract name information
    first_name_val := COALESCE(
        NULLIF(TRIM(user_metadata->>'first_name'), ''),
        NULLIF(TRIM(user_metadata->>'given_name'), ''),
        SPLIT_PART(COALESCE(NULLIF(TRIM(user_metadata->>'full_name'), ''), NEW.email), ' ', 1)
    );
    
    last_name_val := COALESCE(
        NULLIF(TRIM(user_metadata->>'last_name'), ''),
        NULLIF(TRIM(user_metadata->>'family_name'), ''),
        CASE 
            WHEN TRIM(user_metadata->>'full_name') != '' AND position(' ' in TRIM(user_metadata->>'full_name')) > 0
            THEN TRIM(SUBSTRING(TRIM(user_metadata->>'full_name') FROM position(' ' in TRIM(user_metadata->>'full_name')) + 1))
            ELSE 'User'
        END
    );
    
    -- Determine user type and role
    user_type_val := COALESCE(NULLIF(TRIM(user_metadata->>'user_type'), ''), 'pending');
    
    CASE user_type_val
        WHEN 'mentor' THEN 
            user_role_val := 'mentor'::public.user_role;
            verification_status_val := 'pending_validation'::public.verification_status;
        WHEN 'mentee' THEN 
            user_role_val := 'mentee'::public.user_role;
            verification_status_val := 'active'::public.verification_status;
        WHEN 'admin' THEN 
            user_role_val := 'admin'::public.user_role;
            verification_status_val := 'active'::public.verification_status;
        WHEN 'volunteer' THEN 
            user_role_val := 'volunteer'::public.user_role;
            verification_status_val := 'active'::public.verification_status;
        WHEN 'moderator' THEN 
            user_role_val := 'moderator'::public.user_role;
            verification_status_val := 'active'::public.verification_status;
        ELSE 
            user_role_val := 'pending'::public.user_role;
            verification_status_val := 'pending'::public.verification_status;
    END CASE;
    
    -- Insert profile
    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        full_name,
        avatar_url,
        role,
        status,
        verification_status,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        first_name_val,
        last_name_val,
        COALESCE(first_name_val || ' ' || last_name_val, first_name_val, last_name_val, NEW.email),
        user_metadata->>'avatar_url',
        user_role_val,
        CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN 'active'::public.user_status ELSE 'pending'::public.user_status END,
        verification_status_val,
        NOW(),
        NOW()
    );
    
    -- Assign role in user_roles table
    SELECT * INTO role_record FROM public.roles WHERE name = user_role_val::TEXT;
    IF role_record.id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id, is_primary, assigned_at)
        VALUES (NEW.id, role_record.id, true, NOW());
    END IF;
    
    -- Create validation request for mentors
    IF user_role_val = 'mentor'::public.user_role THEN
        INSERT INTO public.validation_requests (
            user_id,
            request_type,
            status,
            data,
            submitted_at
        ) VALUES (
            NEW.id,
            'mentor_verification',
            'pending',
            jsonb_build_object(
                'user_type', user_type_val,
                'registration_method', CASE WHEN user_metadata->>'provider' IS NOT NULL THEN 'oauth' ELSE 'email' END,
                'provider', user_metadata->>'provider'
            ),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- =================================================================
-- 3. JWT CUSTOM ACCESS TOKEN HOOK
-- =================================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    claims jsonb;
    user_id_val UUID;
    profile_role TEXT;
    profile_status TEXT;
    user_permissions TEXT[];
BEGIN
    -- Extract user ID from event
    user_id_val := (event->>'user_id')::UUID;
    
    -- Get user profile information
    SELECT 
        p.role::TEXT,
        p.status::TEXT
    INTO 
        profile_role,
        profile_status
    FROM public.profiles p
    WHERE p.id = user_id_val;
    
    -- Get user permissions
    SELECT public.get_user_permissions(user_id_val) INTO user_permissions;
    
    -- Build custom claims
    claims := jsonb_build_object(
        'role', COALESCE(profile_role, 'pending'),
        'status', COALESCE(profile_status, 'pending'),
        'permissions', COALESCE(user_permissions, ARRAY[]::TEXT[]),
        'user_id', user_id_val
    );
    
    -- Merge with existing claims
    RETURN jsonb_set(event, '{claims}', (COALESCE(event->'claims', '{}'::jsonb)) || claims);
END;
$$;

-- =================================================================
-- 4. CREATE TRIGGERS
-- =================================================================

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for profile slug generation
CREATE TRIGGER generate_profile_slug_trigger
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.generate_profile_slug();

-- Trigger for updated_at timestamp on profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at timestamp on roles
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at timestamp on validation_requests
CREATE TRIGGER update_validation_requests_updated_at
    BEFORE UPDATE ON public.validation_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =================================================================
-- 5. GRANT PERMISSIONS FOR JWT HOOK
-- =================================================================

-- Grant permissions for Supabase Auth to execute the JWT hook
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;

-- =================================================================
-- 6. UPDATE RLS POLICIES WITH PERMISSION FUNCTIONS
-- =================================================================

-- Add admin policies that use the permission functions
CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING (
        public.user_has_permission(auth.uid(), 'admin_users')
    );

CREATE POLICY "Admins can manage user roles" ON public.user_roles
    FOR ALL USING (
        public.user_has_permission(auth.uid(), 'admin_users') OR
        public.user_has_permission(auth.uid(), 'manage_roles')
    );

CREATE POLICY "Moderators can manage validation requests" ON public.validation_requests
    FOR ALL USING (
        public.user_has_permission(auth.uid(), 'admin_verifications') OR
        public.user_has_permission(auth.uid(), 'moderate_verifications')
    );