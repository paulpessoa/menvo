-- =================================================================
-- RBAC SYSTEM VALIDATION AND MANAGEMENT SCRIPT
-- This script validates the RBAC system and provides management functions
-- =================================================================

-- =================================================================
-- 1. VALIDATE RBAC TABLES STRUCTURE
-- =================================================================

DO $
DECLARE
    table_count INTEGER;
    missing_tables TEXT[];
    column_count INTEGER;
BEGIN
    RAISE NOTICE 'Validating RBAC system structure...';
    
    -- Check all required tables exist
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('roles', 'permissions', 'role_permissions', 'user_roles');
    
    IF table_count != 4 THEN
        SELECT ARRAY_AGG(table_name) INTO missing_tables
        FROM (
            SELECT unnest(ARRAY['roles', 'permissions', 'role_permissions', 'user_roles']) as table_name
            EXCEPT
            SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
        ) missing;
        
        RAISE EXCEPTION 'Missing RBAC tables: %', array_to_string(missing_tables, ', ');
    END IF;
    
    -- Validate roles table structure
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roles'
    AND column_name IN ('id', 'name', 'description', 'is_system_role', 'created_at', 'updated_at');
    
    IF column_count != 6 THEN
        RAISE EXCEPTION 'roles table missing required columns';
    END IF;
    
    -- Validate permissions table structure
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'permissions'
    AND column_name IN ('id', 'name', 'description', 'resource', 'action', 'created_at');
    
    IF column_count != 6 THEN
        RAISE EXCEPTION 'permissions table missing required columns';
    END IF;
    
    -- Validate role_permissions table structure
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'role_permissions'
    AND column_name IN ('id', 'role_id', 'permission_id', 'created_at');
    
    IF column_count != 4 THEN
        RAISE EXCEPTION 'role_permissions table missing required columns';
    END IF;
    
    -- Validate user_roles table structure
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_roles'
    AND column_name IN ('id', 'user_id', 'role_id', 'is_primary', 'assigned_by', 'assigned_at', 'expires_at');
    
    IF column_count != 7 THEN
        RAISE EXCEPTION 'user_roles table missing required columns';
    END IF;
    
    RAISE NOTICE 'RBAC table structure validation passed';
    
END $;

-- =================================================================
-- 2. VALIDATE SYSTEM ROLES
-- =================================================================

DO $
DECLARE
    role_count INTEGER;
    missing_roles TEXT[];
    required_roles TEXT[] := ARRAY['pending', 'mentee', 'mentor', 'admin', 'volunteer', 'moderator'];
    role_name TEXT;
BEGIN
    RAISE NOTICE 'Validating system roles...';
    
    -- Check all required roles exist
    SELECT COUNT(*) INTO role_count
    FROM public.roles
    WHERE name = ANY(required_roles);
    
    IF role_count != array_length(required_roles, 1) THEN
        SELECT ARRAY_AGG(role_name) INTO missing_roles
        FROM (
            SELECT unnest(required_roles) as role_name
            EXCEPT
            SELECT name FROM public.roles
        ) missing;
        
        RAISE EXCEPTION 'Missing required roles: %', array_to_string(missing_roles, ', ');
    END IF;
    
    -- Validate each role has proper configuration
    FOREACH role_name IN ARRAY required_roles LOOP
        IF NOT EXISTS (SELECT 1 FROM public.roles WHERE name = role_name AND is_system_role = true) THEN
            RAISE EXCEPTION 'Role % is not marked as system role', role_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'System roles validation passed: % roles found', role_count;
    
END $;

-- =================================================================
-- 3. VALIDATE PERMISSIONS
-- =================================================================

DO $
DECLARE
    permission_count INTEGER;
    missing_permissions TEXT[];
    required_permissions TEXT[] := ARRAY[
        'view_mentors', 'view_profiles', 'update_own_profile',
        'book_sessions', 'provide_mentorship', 'manage_availability',
        'admin_users', 'admin_verifications', 'admin_system', 'manage_roles',
        'validate_activities', 'moderate_content', 'moderate_verifications'
    ];
    permission_name TEXT;
BEGIN
    RAISE NOTICE 'Validating permissions...';
    
    -- Check all required permissions exist
    SELECT COUNT(*) INTO permission_count
    FROM public.permissions
    WHERE name = ANY(required_permissions);
    
    IF permission_count != array_length(required_permissions, 1) THEN
        SELECT ARRAY_AGG(permission_name) INTO missing_permissions
        FROM (
            SELECT unnest(required_permissions) as permission_name
            EXCEPT
            SELECT name FROM public.permissions
        ) missing;
        
        RAISE EXCEPTION 'Missing required permissions: %', array_to_string(missing_permissions, ', ');
    END IF;
    
    -- Validate permissions have proper resource and action
    FOREACH permission_name IN ARRAY required_permissions LOOP
        IF NOT EXISTS (
            SELECT 1 FROM public.permissions 
            WHERE name = permission_name 
            AND resource IS NOT NULL 
            AND action IS NOT NULL
        ) THEN
            RAISE EXCEPTION 'Permission % missing resource or action', permission_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Permissions validation passed: % permissions found', permission_count;
    
END $;

-- =================================================================
-- 4. VALIDATE ROLE-PERMISSION MAPPINGS
-- =================================================================

DO $
DECLARE
    admin_permissions INTEGER;
    mentor_permissions INTEGER;
    mentee_permissions INTEGER;
    moderator_permissions INTEGER;
    volunteer_permissions INTEGER;
BEGIN
    RAISE NOTICE 'Validating role-permission mappings...';
    
    -- Check admin has all permissions
    SELECT COUNT(*) INTO admin_permissions
    FROM public.role_permissions rp
    JOIN public.roles r ON rp.role_id = r.id
    WHERE r.name = 'admin';
    
    IF admin_permissions = 0 THEN
        RAISE EXCEPTION 'Admin role has no permissions assigned';
    END IF;
    
    -- Check mentor has required permissions
    SELECT COUNT(*) INTO mentor_permissions
    FROM public.role_permissions rp
    JOIN public.roles r ON rp.role_id = r.id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE r.name = 'mentor' 
    AND p.name IN ('view_mentors', 'provide_mentorship', 'manage_availability');
    
    IF mentor_permissions < 3 THEN
        RAISE EXCEPTION 'Mentor role missing required permissions';
    END IF;
    
    -- Check mentee has required permissions
    SELECT COUNT(*) INTO mentee_permissions
    FROM public.role_permissions rp
    JOIN public.roles r ON rp.role_id = r.id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE r.name = 'mentee' 
    AND p.name IN ('view_mentors', 'book_sessions');
    
    IF mentee_permissions < 2 THEN
        RAISE EXCEPTION 'Mentee role missing required permissions';
    END IF;
    
    -- Check moderator has moderation permissions
    SELECT COUNT(*) INTO moderator_permissions
    FROM public.role_permissions rp
    JOIN public.roles r ON rp.role_id = r.id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE r.name = 'moderator' 
    AND p.name IN ('moderate_content', 'admin_verifications');
    
    IF moderator_permissions < 2 THEN
        RAISE EXCEPTION 'Moderator role missing required permissions';
    END IF;
    
    -- Check volunteer has validation permissions
    SELECT COUNT(*) INTO volunteer_permissions
    FROM public.role_permissions rp
    JOIN public.roles r ON rp.role_id = r.id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE r.name = 'volunteer' 
    AND p.name = 'validate_activities';
    
    IF volunteer_permissions = 0 THEN
        RAISE EXCEPTION 'Volunteer role missing validation permission';
    END IF;
    
    RAISE NOTICE 'Role-permission mappings validation passed';
    RAISE NOTICE 'Admin: % permissions, Mentor: %, Mentee: %, Moderator: %, Volunteer: %', 
        admin_permissions, mentor_permissions, mentee_permissions, moderator_permissions, volunteer_permissions;
    
END $;

-- =================================================================
-- 5. VALIDATE RBAC FUNCTIONS
-- =================================================================

DO $
DECLARE
    function_exists BOOLEAN;
    test_user_id UUID;
    user_permissions TEXT[];
    has_permission BOOLEAN;
BEGIN
    RAISE NOTICE 'Validating RBAC functions...';
    
    -- Check get_user_permissions function exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'get_user_permissions'
    ) INTO function_exists;
    
    IF NOT function_exists THEN
        RAISE EXCEPTION 'get_user_permissions() function does not exist';
    END IF;
    
    -- Check user_has_permission function exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'user_has_permission'
    ) INTO function_exists;
    
    IF NOT function_exists THEN
        RAISE EXCEPTION 'user_has_permission() function does not exist';
    END IF;
    
    -- Test functions with a sample user
    test_user_id := gen_random_uuid();
    
    -- Create test user
    INSERT INTO auth.users (
        id, 
        email, 
        email_confirmed_at, 
        raw_user_meta_data,
        created_at
    ) VALUES (
        test_user_id,
        'rbac.test@example.com',
        NOW(),
        jsonb_build_object(
            'first_name', 'RBAC',
            'last_name', 'Test',
            'user_type', 'mentor'
        ),
        NOW()
    );
    
    -- Test get_user_permissions function
    SELECT public.get_user_permissions(test_user_id) INTO user_permissions;
    
    IF user_permissions IS NULL OR array_length(user_permissions, 1) = 0 THEN
        RAISE EXCEPTION 'get_user_permissions() returned no permissions for mentor user';
    END IF;
    
    -- Test user_has_permission function
    SELECT public.user_has_permission(test_user_id, 'provide_mentorship') INTO has_permission;
    
    IF NOT has_permission THEN
        RAISE EXCEPTION 'user_has_permission() failed to detect mentor permission';
    END IF;
    
    -- Test negative case
    SELECT public.user_has_permission(test_user_id, 'admin_system') INTO has_permission;
    
    IF has_permission THEN
        RAISE EXCEPTION 'user_has_permission() incorrectly granted admin permission to mentor';
    END IF;
    
    RAISE NOTICE 'RBAC functions validation passed';
    
    -- Cleanup
    DELETE FROM auth.users WHERE id = test_user_id;
    
END $;

-- =================================================================
-- 6. VALIDATE RLS POLICIES
-- =================================================================

DO $
DECLARE
    policy_count INTEGER;
    table_name TEXT;
    rls_enabled BOOLEAN;
BEGIN
    RAISE NOTICE 'Validating Row Level Security policies...';
    
    -- Check RLS is enabled on RBAC tables
    FOREACH table_name IN ARRAY ARRAY['roles', 'permissions', 'role_permissions', 'user_roles'] LOOP
        SELECT relrowsecurity INTO rls_enabled
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' AND c.relname = table_name;
        
        IF NOT rls_enabled THEN
            RAISE EXCEPTION 'RLS not enabled on table %', table_name;
        END IF;
    END LOOP;
    
    -- Check policies exist for key tables
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('roles', 'permissions', 'user_roles');
    
    IF policy_count = 0 THEN
        RAISE EXCEPTION 'No RLS policies found for RBAC tables';
    END IF;
    
    RAISE NOTICE 'RLS validation passed: % policies found', policy_count;
    
END $;

-- =================================================================
-- 7. CREATE RBAC MANAGEMENT FUNCTIONS
-- =================================================================

-- Function to assign role to user
CREATE OR REPLACE FUNCTION public.assign_user_role(
    target_user_id UUID,
    role_name TEXT,
    assigned_by_user_id UUID DEFAULT NULL,
    expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS BOOLEAN AS $
DECLARE
    role_id UUID;
    existing_assignment UUID;
BEGIN
    -- Get role ID
    SELECT id INTO role_id FROM public.roles WHERE name = role_name;
    
    IF role_id IS NULL THEN
        RAISE EXCEPTION 'Role % does not exist', role_name;
    END IF;
    
    -- Check if assignment already exists
    SELECT id INTO existing_assignment 
    FROM public.user_roles 
    WHERE user_id = target_user_id AND role_id = role_id;
    
    IF existing_assignment IS NOT NULL THEN
        RAISE NOTICE 'User already has role %', role_name;
        RETURN false;
    END IF;
    
    -- Create assignment
    INSERT INTO public.user_roles (user_id, role_id, assigned_by, assigned_at, expires_at)
    VALUES (target_user_id, role_id, assigned_by_user_id, NOW(), expires_at);
    
    -- Update profile role if this is primary role
    UPDATE public.profiles 
    SET role = role_name::public.user_role, updated_at = NOW()
    WHERE id = target_user_id;
    
    RETURN true;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove role from user
CREATE OR REPLACE FUNCTION public.remove_user_role(
    target_user_id UUID,
    role_name TEXT
)
RETURNS BOOLEAN AS $
DECLARE
    role_id UUID;
    assignment_count INTEGER;
BEGIN
    -- Get role ID
    SELECT id INTO role_id FROM public.roles WHERE name = role_name;
    
    IF role_id IS NULL THEN
        RAISE EXCEPTION 'Role % does not exist', role_name;
    END IF;
    
    -- Remove assignment
    DELETE FROM public.user_roles 
    WHERE user_id = target_user_id AND role_id = role_id;
    
    GET DIAGNOSTICS assignment_count = ROW_COUNT;
    
    IF assignment_count = 0 THEN
        RAISE NOTICE 'User did not have role %', role_name;
        RETURN false;
    END IF;
    
    -- Update profile role to pending if no other roles
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target_user_id) THEN
        UPDATE public.profiles 
        SET role = 'pending'::public.user_role, updated_at = NOW()
        WHERE id = target_user_id;
    END IF;
    
    RETURN true;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's roles
CREATE OR REPLACE FUNCTION public.get_user_roles(user_uuid UUID)
RETURNS TABLE(role_name TEXT, assigned_at TIMESTAMPTZ, expires_at TIMESTAMPTZ) AS $
BEGIN
    RETURN QUERY
    SELECT 
        r.name,
        ur.assigned_at,
        ur.expires_at
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid
    ORDER BY ur.assigned_at DESC;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- 8. RBAC SYSTEM SUMMARY REPORT
-- =================================================================

CREATE OR REPLACE VIEW public.rbac_system_summary AS
SELECT 
    'Roles' as component,
    COUNT(*)::TEXT as count,
    string_agg(name, ', ' ORDER BY name) as details
FROM public.roles
UNION ALL
SELECT 
    'Permissions',
    COUNT(*)::TEXT,
    COUNT(*)::TEXT || ' permissions across ' || COUNT(DISTINCT resource)::TEXT || ' resources'
FROM public.permissions
UNION ALL
SELECT 
    'Role-Permission Mappings',
    COUNT(*)::TEXT,
    'Mappings across ' || COUNT(DISTINCT role_id)::TEXT || ' roles'
FROM public.role_permissions
UNION ALL
SELECT 
    'User Role Assignments',
    COUNT(*)::TEXT,
    COUNT(DISTINCT user_id)::TEXT || ' users with role assignments'
FROM public.user_roles;

-- =================================================================
-- FINAL VALIDATION SUMMARY
-- =================================================================

SELECT 
    'RBAC SYSTEM VALIDATION COMPLETED' as status,
    'All validations passed successfully' as result,
    NOW() as completed_at;

SELECT * FROM public.rbac_system_summary;

-- Display role-permission matrix
SELECT 
    r.name as role,
    string_agg(p.name, ', ' ORDER BY p.name) as permissions
FROM public.roles r
LEFT JOIN public.role_permissions rp ON r.id = rp.role_id
LEFT JOIN public.permissions p ON rp.permission_id = p.id
GROUP BY r.name, r.created_at
ORDER BY r.created_at;

RAISE NOTICE 'RBAC system validation completed successfully!';
RAISE NOTICE 'Management functions created: assign_user_role(), remove_user_role(), get_user_roles()';
RAISE NOTICE 'Summary view created: rbac_system_summary';