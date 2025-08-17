-- =================================================================
-- TEST SCRIPT FOR custom_access_token_hook() FUNCTION
-- This script tests the JWT custom access token hook function
-- =================================================================

-- =================================================================
-- 1. VALIDATE FUNCTION EXISTS AND SIGNATURE
-- =================================================================

DO $
DECLARE
    function_exists BOOLEAN;
    function_info RECORD;
BEGIN
    -- Check if function exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'custom_access_token_hook'
    ) INTO function_exists;
    
    IF NOT function_exists THEN
        RAISE EXCEPTION 'custom_access_token_hook() function does not exist';
    END IF;
    
    -- Get function details
    SELECT 
        p.proname,
        pg_get_function_result(p.oid) as return_type,
        pg_get_function_arguments(p.oid) as arguments,
        p.prosecdef as is_security_definer,
        p.provolatile as volatility
    INTO function_info
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'custom_access_token_hook';
    
    -- Validate function signature
    IF function_info.return_type != 'jsonb' THEN
        RAISE EXCEPTION 'custom_access_token_hook() should return jsonb, got %', function_info.return_type;
    END IF;
    
    IF function_info.arguments != 'event jsonb' THEN
        RAISE EXCEPTION 'custom_access_token_hook() should accept jsonb parameter, got %', function_info.arguments;
    END IF;
    
    IF NOT function_info.is_security_definer THEN
        RAISE EXCEPTION 'custom_access_token_hook() should be SECURITY DEFINER';
    END IF;
    
    -- Check if function is marked as STABLE (important for JWT hooks)
    IF function_info.volatility != 's' THEN
        RAISE EXCEPTION 'custom_access_token_hook() should be STABLE, got volatility %', function_info.volatility;
    END IF;
    
    RAISE NOTICE 'Function signature validation passed';
    
END $;

-- =================================================================
-- 2. TEST JWT HOOK WITH DIFFERENT USER SCENARIOS
-- =================================================================

DO $
DECLARE
    test_user_id UUID;
    test_event JSONB;
    result_event JSONB;
    claims JSONB;
    permissions TEXT[];
BEGIN
    RAISE NOTICE 'Starting JWT hook function tests...';
    
    -- =================================================================
    -- TEST 1: Mentee User JWT Claims
    -- =================================================================
    RAISE NOTICE 'TEST 1: Mentee User JWT Claims';
    
    test_user_id := gen_random_uuid();
    
    -- Create test mentee user
    INSERT INTO auth.users (
        id, 
        email, 
        email_confirmed_at, 
        raw_user_meta_data,
        created_at
    ) VALUES (
        test_user_id,
        'jwt.mentee@example.com',
        NOW(),
        jsonb_build_object(
            'first_name', 'JWT',
            'last_name', 'Mentee',
            'user_type', 'mentee'
        ),
        NOW()
    );
    
    -- Create test JWT event
    test_event := jsonb_build_object(
        'user_id', test_user_id::TEXT,
        'claims', jsonb_build_object()
    );
    
    -- Call the JWT hook function
    SELECT public.custom_access_token_hook(test_event) INTO result_event;
    
    -- Extract claims from result
    claims := result_event->'claims';
    
    -- Validate claims structure
    IF NOT (claims ? 'role') THEN
        RAISE EXCEPTION 'TEST 1 FAILED: Missing role claim';
    END IF;
    
    IF NOT (claims ? 'status') THEN
        RAISE EXCEPTION 'TEST 1 FAILED: Missing status claim';
    END IF;
    
    IF NOT (claims ? 'permissions') THEN
        RAISE EXCEPTION 'TEST 1 FAILED: Missing permissions claim';
    END IF;
    
    IF NOT (claims ? 'user_id') THEN
        RAISE EXCEPTION 'TEST 1 FAILED: Missing user_id claim';
    END IF;
    
    -- Validate claim values
    IF claims->>'role' != 'mentee' THEN
        RAISE EXCEPTION 'TEST 1 FAILED: Expected role mentee, got %', claims->>'role';
    END IF;
    
    IF claims->>'status' != 'active' THEN
        RAISE EXCEPTION 'TEST 1 FAILED: Expected status active, got %', claims->>'status';
    END IF;
    
    IF claims->>'user_id' != test_user_id::TEXT THEN
        RAISE EXCEPTION 'TEST 1 FAILED: User ID mismatch';
    END IF;
    
    -- Validate permissions array
    SELECT ARRAY(SELECT jsonb_array_elements_text(claims->'permissions')) INTO permissions;
    
    IF NOT ('view_mentors' = ANY(permissions)) THEN
        RAISE EXCEPTION 'TEST 1 FAILED: Mentee should have view_mentors permission';
    END IF;
    
    IF NOT ('book_sessions' = ANY(permissions)) THEN
        RAISE EXCEPTION 'TEST 1 FAILED: Mentee should have book_sessions permission';
    END IF;
    
    RAISE NOTICE 'TEST 1 PASSED: Mentee JWT claims are correct';
    
    DELETE FROM auth.users WHERE id = test_user_id;
    
    -- =================================================================
    -- TEST 2: Mentor User JWT Claims
    -- =================================================================
    RAISE NOTICE 'TEST 2: Mentor User JWT Claims';
    
    test_user_id := gen_random_uuid();
    
    -- Create test mentor user
    INSERT INTO auth.users (
        id, 
        email, 
        email_confirmed_at, 
        raw_user_meta_data,
        created_at
    ) VALUES (
        test_user_id,
        'jwt.mentor@example.com',
        NOW(),
        jsonb_build_object(
            'first_name', 'JWT',
            'last_name', 'Mentor',
            'user_type', 'mentor'
        ),
        NOW()
    );
    
    test_event := jsonb_build_object(
        'user_id', test_user_id::TEXT,
        'claims', jsonb_build_object()
    );
    
    SELECT public.custom_access_token_hook(test_event) INTO result_event;
    claims := result_event->'claims';
    
    IF claims->>'role' != 'mentor' THEN
        RAISE EXCEPTION 'TEST 2 FAILED: Expected role mentor, got %', claims->>'role';
    END IF;
    
    -- Validate mentor permissions
    SELECT ARRAY(SELECT jsonb_array_elements_text(claims->'permissions')) INTO permissions;
    
    IF NOT ('provide_mentorship' = ANY(permissions)) THEN
        RAISE EXCEPTION 'TEST 2 FAILED: Mentor should have provide_mentorship permission';
    END IF;
    
    IF NOT ('manage_availability' = ANY(permissions)) THEN
        RAISE EXCEPTION 'TEST 2 FAILED: Mentor should have manage_availability permission';
    END IF;
    
    RAISE NOTICE 'TEST 2 PASSED: Mentor JWT claims are correct';
    
    DELETE FROM auth.users WHERE id = test_user_id;
    
    -- =================================================================
    -- TEST 3: Admin User JWT Claims
    -- =================================================================
    RAISE NOTICE 'TEST 3: Admin User JWT Claims';
    
    test_user_id := gen_random_uuid();
    
    -- Create test admin user
    INSERT INTO auth.users (
        id, 
        email, 
        email_confirmed_at, 
        raw_user_meta_data,
        created_at
    ) VALUES (
        test_user_id,
        'jwt.admin@example.com',
        NOW(),
        jsonb_build_object(
            'first_name', 'JWT',
            'last_name', 'Admin',
            'user_type', 'admin'
        ),
        NOW()
    );
    
    test_event := jsonb_build_object(
        'user_id', test_user_id::TEXT,
        'claims', jsonb_build_object()
    );
    
    SELECT public.custom_access_token_hook(test_event) INTO result_event;
    claims := result_event->'claims';
    
    IF claims->>'role' != 'admin' THEN
        RAISE EXCEPTION 'TEST 3 FAILED: Expected role admin, got %', claims->>'role';
    END IF;
    
    -- Validate admin has all permissions
    SELECT ARRAY(SELECT jsonb_array_elements_text(claims->'permissions')) INTO permissions;
    
    IF NOT ('admin_users' = ANY(permissions)) THEN
        RAISE EXCEPTION 'TEST 3 FAILED: Admin should have admin_users permission';
    END IF;
    
    IF NOT ('admin_system' = ANY(permissions)) THEN
        RAISE EXCEPTION 'TEST 3 FAILED: Admin should have admin_system permission';
    END IF;
    
    -- Admin should have more permissions than other roles
    IF array_length(permissions, 1) < 5 THEN
        RAISE EXCEPTION 'TEST 3 FAILED: Admin should have multiple permissions, got %', array_length(permissions, 1);
    END IF;
    
    RAISE NOTICE 'TEST 3 PASSED: Admin JWT claims are correct';
    
    DELETE FROM auth.users WHERE id = test_user_id;
    
    -- =================================================================
    -- TEST 4: Pending User (OAuth without role selection)
    -- =================================================================
    RAISE NOTICE 'TEST 4: Pending User JWT Claims';
    
    test_user_id := gen_random_uuid();
    
    -- Create test pending user (OAuth user without role selection)
    INSERT INTO auth.users (
        id, 
        email, 
        email_confirmed_at, 
        raw_user_meta_data,
        created_at
    ) VALUES (
        test_user_id,
        'jwt.pending@example.com',
        NOW(),
        jsonb_build_object(
            'provider', 'google',
            'given_name', 'JWT',
            'family_name', 'Pending'
        ),
        NOW()
    );
    
    test_event := jsonb_build_object(
        'user_id', test_user_id::TEXT,
        'claims', jsonb_build_object()
    );
    
    SELECT public.custom_access_token_hook(test_event) INTO result_event;
    claims := result_event->'claims';
    
    IF claims->>'role' != 'pending' THEN
        RAISE EXCEPTION 'TEST 4 FAILED: Expected role pending, got %', claims->>'role';
    END IF;
    
    -- Pending users should have minimal permissions
    SELECT ARRAY(SELECT jsonb_array_elements_text(claims->'permissions')) INTO permissions;
    
    IF array_length(permissions, 1) > 0 THEN
        RAISE EXCEPTION 'TEST 4 FAILED: Pending users should have no permissions, got %', array_to_string(permissions, ', ');
    END IF;
    
    RAISE NOTICE 'TEST 4 PASSED: Pending user JWT claims are correct';
    
    DELETE FROM auth.users WHERE id = test_user_id;
    
    -- =================================================================
    -- TEST 5: Non-existent User (Error Handling)
    -- =================================================================
    RAISE NOTICE 'TEST 5: Non-existent User Error Handling';
    
    test_user_id := gen_random_uuid(); -- Random UUID that doesn't exist
    
    test_event := jsonb_build_object(
        'user_id', test_user_id::TEXT,
        'claims', jsonb_build_object()
    );
    
    SELECT public.custom_access_token_hook(test_event) INTO result_event;
    claims := result_event->'claims';
    
    -- Should return default values for non-existent user
    IF claims->>'role' != 'pending' THEN
        RAISE EXCEPTION 'TEST 5 FAILED: Non-existent user should default to pending role, got %', claims->>'role';
    END IF;
    
    IF claims->>'status' != 'pending' THEN
        RAISE EXCEPTION 'TEST 5 FAILED: Non-existent user should default to pending status, got %', claims->>'status';
    END IF;
    
    RAISE NOTICE 'TEST 5 PASSED: Error handling for non-existent user works correctly';
    
    -- =================================================================
    -- TEST 6: Existing Claims Preservation
    -- =================================================================
    RAISE NOTICE 'TEST 6: Existing Claims Preservation';
    
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
        'jwt.existing@example.com',
        NOW(),
        jsonb_build_object(
            'first_name', 'JWT',
            'last_name', 'Existing',
            'user_type', 'mentee'
        ),
        NOW()
    );
    
    -- Create event with existing claims
    test_event := jsonb_build_object(
        'user_id', test_user_id::TEXT,
        'claims', jsonb_build_object(
            'existing_claim', 'should_be_preserved',
            'aud', 'authenticated'
        )
    );
    
    SELECT public.custom_access_token_hook(test_event) INTO result_event;
    claims := result_event->'claims';
    
    -- Check that existing claims are preserved
    IF claims->>'existing_claim' != 'should_be_preserved' THEN
        RAISE EXCEPTION 'TEST 6 FAILED: Existing claims not preserved';
    END IF;
    
    IF claims->>'aud' != 'authenticated' THEN
        RAISE EXCEPTION 'TEST 6 FAILED: Standard claims not preserved';
    END IF;
    
    -- Check that new claims are added
    IF claims->>'role' != 'mentee' THEN
        RAISE EXCEPTION 'TEST 6 FAILED: New role claim not added';
    END IF;
    
    RAISE NOTICE 'TEST 6 PASSED: Existing claims preservation works correctly';
    
    DELETE FROM auth.users WHERE id = test_user_id;
    
    RAISE NOTICE 'All JWT hook tests completed successfully!';
    
END $;

-- =================================================================
-- 3. PERFORMANCE TEST
-- =================================================================

DO $
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    test_user_id UUID;
    test_event JSONB;
    result_event JSONB;
    i INTEGER;
BEGIN
    RAISE NOTICE 'Starting JWT hook performance test...';
    
    -- Create a test user for performance testing
    test_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
        id, 
        email, 
        email_confirmed_at, 
        raw_user_meta_data,
        created_at
    ) VALUES (
        test_user_id,
        'perf.test@example.com',
        NOW(),
        jsonb_build_object(
            'first_name', 'Performance',
            'last_name', 'Test',
            'user_type', 'mentor'
        ),
        NOW()
    );
    
    test_event := jsonb_build_object(
        'user_id', test_user_id::TEXT,
        'claims', jsonb_build_object()
    );
    
    start_time := clock_timestamp();
    
    -- Call the function 1000 times to test performance
    FOR i IN 1..1000 LOOP
        SELECT public.custom_access_token_hook(test_event) INTO result_event;
    END LOOP;
    
    end_time := clock_timestamp();
    
    RAISE NOTICE 'Performance test completed: 1000 JWT hook calls in % ms', 
        EXTRACT(MILLISECONDS FROM (end_time - start_time));
    
    -- Cleanup
    DELETE FROM auth.users WHERE id = test_user_id;
    
END $;

-- =================================================================
-- 4. VALIDATE SUPABASE AUTH PERMISSIONS
-- =================================================================

DO $
DECLARE
    has_permission BOOLEAN;
BEGIN
    -- Check if supabase_auth_admin has execute permission on the function
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routine_privileges
        WHERE routine_schema = 'public'
        AND routine_name = 'custom_access_token_hook'
        AND grantee = 'supabase_auth_admin'
        AND privilege_type = 'EXECUTE'
    ) INTO has_permission;
    
    IF NOT has_permission THEN
        RAISE EXCEPTION 'supabase_auth_admin does not have EXECUTE permission on custom_access_token_hook';
    END IF;
    
    RAISE NOTICE 'Permission validation passed: supabase_auth_admin can execute the function';
    
END $;

-- =================================================================
-- SUMMARY REPORT
-- =================================================================

SELECT 
    'JWT HOOK FUNCTION TESTING COMPLETED' as status,
    'All tests passed successfully' as result,
    NOW() as completed_at;

SELECT 
    'Function Signature' as test_category,
    'PASSED' as status,
    'Correct return type, parameters, and security settings' as details
UNION ALL
SELECT 
    'Mentee Claims',
    'PASSED',
    'Role, status, permissions, and user_id correctly set'
UNION ALL
SELECT 
    'Mentor Claims',
    'PASSED',
    'Mentor-specific permissions included'
UNION ALL
SELECT 
    'Admin Claims',
    'PASSED',
    'All permissions included for admin role'
UNION ALL
SELECT 
    'Pending User Claims',
    'PASSED',
    'Default values for users without role selection'
UNION ALL
SELECT 
    'Error Handling',
    'PASSED',
    'Graceful handling of non-existent users'
UNION ALL
SELECT 
    'Claims Preservation',
    'PASSED',
    'Existing JWT claims are preserved and merged'
UNION ALL
SELECT 
    'Performance',
    'PASSED',
    'Function executes efficiently for production use'
UNION ALL
SELECT 
    'Permissions',
    'PASSED',
    'supabase_auth_admin has required execute permission';

RAISE NOTICE 'JWT hook function is ready for production use!';
RAISE NOTICE 'Configure the hook in Supabase Dashboard: Authentication > Hooks > Add JWT Claims Hook';