-- =====================================================
-- CASCADE DELETE TRIGGERS FOR AUTH USER CLEANUP
-- =====================================================
-- This file contains SQL triggers to automatically clean up
-- related data when a user is deleted from auth.users
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_deleted_cleanup_profiles ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_deleted_cleanup_user_roles ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_deleted_cleanup_mentor_availability ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_deleted_cleanup_appointments ON auth.users;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS cleanup_user_profiles();
DROP FUNCTION IF EXISTS cleanup_user_roles();
DROP FUNCTION IF EXISTS cleanup_mentor_availability();
DROP FUNCTION IF EXISTS cleanup_user_appointments();

-- =====================================================
-- 1. PROFILES CLEANUP TRIGGER
-- =====================================================
-- Function to clean up profiles when user is deleted
CREATE OR REPLACE FUNCTION cleanup_user_profiles()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the cleanup operation
    RAISE LOG 'Cleaning up profile for deleted user: %', OLD.id;
    
    -- Delete from profiles table
    DELETE FROM public.profiles WHERE id = OLD.id;
    
    -- Log completion
    RAISE LOG 'Profile cleanup completed for user: %', OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for profiles cleanup
CREATE TRIGGER on_auth_user_deleted_cleanup_profiles
    AFTER DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_user_profiles();

-- =====================================================
-- 2. USER ROLES CLEANUP TRIGGER
-- =====================================================
-- Function to clean up user_roles when user is deleted
CREATE OR REPLACE FUNCTION cleanup_user_roles()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the cleanup operation
    RAISE LOG 'Cleaning up user_roles for deleted user: %', OLD.id;
    
    -- Delete from user_roles table
    DELETE FROM public.user_roles WHERE user_id = OLD.id;
    
    -- Log completion
    RAISE LOG 'User_roles cleanup completed for user: %', OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user_roles cleanup
CREATE TRIGGER on_auth_user_deleted_cleanup_user_roles
    AFTER DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_user_roles();

-- =====================================================
-- 3. MENTOR AVAILABILITY CLEANUP TRIGGER
-- =====================================================
-- Function to clean up mentor_availability when user is deleted
CREATE OR REPLACE FUNCTION cleanup_mentor_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the cleanup operation
    RAISE LOG 'Cleaning up mentor_availability for deleted user: %', OLD.id;
    
    -- Delete from mentor_availability table
    DELETE FROM public.mentor_availability WHERE mentor_id = OLD.id;
    
    -- Log completion
    RAISE LOG 'Mentor_availability cleanup completed for user: %', OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for mentor_availability cleanup
CREATE TRIGGER on_auth_user_deleted_cleanup_mentor_availability
    AFTER DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_mentor_availability();

-- =====================================================
-- 4. APPOINTMENTS CLEANUP TRIGGER
-- =====================================================
-- Function to clean up appointments when user is deleted
CREATE OR REPLACE FUNCTION cleanup_user_appointments()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the cleanup operation
    RAISE LOG 'Cleaning up appointments for deleted user: %', OLD.id;
    
    -- Delete appointments where user is mentor or mentee
    DELETE FROM public.appointments 
    WHERE mentor_id = OLD.id OR mentee_id = OLD.id;
    
    -- Log completion
    RAISE LOG 'Appointments cleanup completed for user: %', OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for appointments cleanup
CREATE TRIGGER on_auth_user_deleted_cleanup_appointments
    AFTER DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_user_appointments();

-- =====================================================
-- 5. ADDITIONAL CLEANUP TRIGGERS (OPTIONAL)
-- =====================================================

-- Function to clean up mentorship sessions
CREATE OR REPLACE FUNCTION cleanup_mentorship_sessions()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the cleanup operation
    RAISE LOG 'Cleaning up mentorship_sessions for deleted user: %', OLD.id;
    
    -- Delete mentorship sessions where user is mentor or mentee
    DELETE FROM public.mentorship_sessions 
    WHERE mentor_id = OLD.id OR mentee_id = OLD.id;
    
    -- Log completion
    RAISE LOG 'Mentorship_sessions cleanup completed for user: %', OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for mentorship sessions cleanup
CREATE TRIGGER on_auth_user_deleted_cleanup_mentorship_sessions
    AFTER DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_mentorship_sessions();

-- Function to clean up feedback
CREATE OR REPLACE FUNCTION cleanup_user_feedback()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the cleanup operation
    RAISE LOG 'Cleaning up feedback for deleted user: %', OLD.id;
    
    -- Delete feedback given by or received by the user
    DELETE FROM public.feedback 
    WHERE mentor_id = OLD.id OR mentee_id = OLD.id;
    
    -- Log completion
    RAISE LOG 'Feedback cleanup completed for user: %', OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for feedback cleanup
CREATE TRIGGER on_auth_user_deleted_cleanup_feedback
    AFTER DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_user_feedback();

-- =====================================================
-- 6. VERIFICATION AND LOGGING
-- =====================================================

-- Function to log user deletion for audit purposes
CREATE OR REPLACE FUNCTION log_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert audit log entry
    INSERT INTO public.audit_logs (
        table_name,
        operation,
        old_data,
        user_id,
        timestamp
    ) VALUES (
        'auth.users',
        'DELETE',
        row_to_json(OLD),
        OLD.id,
        NOW()
    );
    
    RAISE LOG 'User deletion logged: % (email: %)', OLD.id, OLD.email;
    
    RETURN OLD;
EXCEPTION
    WHEN OTHERS THEN
        -- If audit logging fails, don't prevent the deletion
        RAISE LOG 'Failed to log user deletion for %: %', OLD.id, SQLERRM;
        RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for audit logging (if audit_logs table exists)
-- This trigger will fail gracefully if the table doesn't exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        CREATE TRIGGER on_auth_user_deleted_audit_log
            BEFORE DELETE ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION log_user_deletion();
        RAISE LOG 'Audit logging trigger created successfully';
    ELSE
        RAISE LOG 'Audit_logs table not found, skipping audit trigger creation';
    END IF;
END $$;

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on the functions to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_user_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_user_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_mentor_availability() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_user_appointments() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_mentorship_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_user_feedback() TO authenticated;
GRANT EXECUTE ON FUNCTION log_user_deletion() TO authenticated;

-- =====================================================
-- 8. VERIFICATION QUERIES
-- =====================================================

-- Query to verify triggers are created
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%auth_user_deleted%'
ORDER BY trigger_name;

-- Query to verify functions are created
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name LIKE '%cleanup_%' OR routine_name LIKE '%log_user_%'
ORDER BY routine_name;

-- =====================================================
-- USAGE NOTES:
-- =====================================================
-- 1. These triggers will automatically fire when a user is deleted from auth.users
-- 2. All related data will be cleaned up in the correct order
-- 3. Logging is included for audit purposes
-- 4. Triggers are created with SECURITY DEFINER to ensure proper permissions
-- 5. Error handling is included to prevent cascade failures
-- 6. To test: DELETE FROM auth.users WHERE id = 'test-user-id';
-- 7. To disable: DROP TRIGGER trigger_name ON auth.users;
-- 8. To re-enable: Run the CREATE TRIGGER statements again
-- =====================================================