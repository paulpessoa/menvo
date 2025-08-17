-- =================================================================
-- MENVO - DATABASE BACKUP AND ANALYSIS SCRIPT
-- This script creates backups and analyzes the current database state
-- Execute this BEFORE running any cleanup operations
-- =================================================================

-- Create backup schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS backup_auth_cleanup;

-- Set search path to include backup schema
SET search_path = public, backup_auth_cleanup;

-- =================================================================
-- 1. BACKUP EXISTING DATA
-- =================================================================

-- Backup auth.users data (only metadata, not sensitive data)
CREATE TABLE IF NOT EXISTS backup_auth_cleanup.auth_users_backup AS
SELECT 
    id,
    email,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
FROM auth.users;

-- Backup profiles table
DO $
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        EXECUTE 'CREATE TABLE IF NOT EXISTS backup_auth_cleanup.profiles_backup AS SELECT * FROM public.profiles';
    END IF;
END $;

-- Backup roles table if exists
DO $
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles' AND table_schema = 'public') THEN
        EXECUTE 'CREATE TABLE IF NOT EXISTS backup_auth_cleanup.roles_backup AS SELECT * FROM public.roles';
    END IF;
END $;

-- Backup permissions table if exists
DO $
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions' AND table_schema = 'public') THEN
        EXECUTE 'CREATE TABLE IF NOT EXISTS backup_auth_cleanup.permissions_backup AS SELECT * FROM public.permissions';
    END IF;
END $;

-- Backup role_permissions table if exists
DO $
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_permissions' AND table_schema = 'public') THEN
        EXECUTE 'CREATE TABLE IF NOT EXISTS backup_auth_cleanup.role_permissions_backup AS SELECT * FROM public.role_permissions';
    END IF;
END $;

-- Backup user_roles table if exists
DO $
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public') THEN
        EXECUTE 'CREATE TABLE IF NOT EXISTS backup_auth_cleanup.user_roles_backup AS SELECT * FROM public.user_roles';
    END IF;
END $;

-- Backup mentor_profiles table if exists
DO $
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mentor_profiles' AND table_schema = 'public') THEN
        EXECUTE 'CREATE TABLE IF NOT EXISTS backup_auth_cleanup.mentor_profiles_backup AS SELECT * FROM public.mentor_profiles';
    END IF;
END $;

-- Backup validation_requests table if exists
DO $
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'validation_requests' AND table_schema = 'public') THEN
        EXECUTE 'CREATE TABLE IF NOT EXISTS backup_auth_cleanup.validation_requests_backup AS SELECT * FROM public.validation_requests';
    END IF;
END $;

-- =================================================================
-- 2. ANALYZE CURRENT DATABASE STATE
-- =================================================================

-- Create analysis results table
CREATE TABLE IF NOT EXISTS backup_auth_cleanup.analysis_results (
    analysis_type TEXT,
    description TEXT,
    count_value INTEGER,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clear previous analysis
DELETE FROM backup_auth_cleanup.analysis_results;

-- Analyze auth.users table
INSERT INTO backup_auth_cleanup.analysis_results (analysis_type, description, count_value, details)
SELECT 
    'auth_users',
    'Total users in auth.users',
    COUNT(*),
    jsonb_build_object(
        'confirmed_emails', COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL),
        'unconfirmed_emails', COUNT(*) FILTER (WHERE email_confirmed_at IS NULL),
        'with_metadata', COUNT(*) FILTER (WHERE raw_user_meta_data IS NOT NULL),
        'oauth_users', COUNT(*) FILTER (WHERE raw_user_meta_data->>'provider' IS NOT NULL)
    )
FROM auth.users;

-- Analyze profiles table if exists
DO $
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        INSERT INTO backup_auth_cleanup.analysis_results (analysis_type, description, count_value, details)
        SELECT 
            'profiles',
            'Total profiles',
            COUNT(*),
            jsonb_build_object(
                'pending_role', COUNT(*) FILTER (WHERE role::TEXT = 'pending' OR role IS NULL),
                'mentors', COUNT(*) FILTER (WHERE role::TEXT = 'mentor'),
                'mentees', COUNT(*) FILTER (WHERE role::TEXT = 'mentee'),
                'admins', COUNT(*) FILTER (WHERE role::TEXT = 'admin'),
                'volunteers', COUNT(*) FILTER (WHERE role::TEXT = 'volunteer'),
                'moderators', COUNT(*) FILTER (WHERE role::TEXT = 'moderator'),
                'missing_names', COUNT(*) FILTER (WHERE first_name IS NULL OR last_name IS NULL),
                'with_slugs', COUNT(*) FILTER (WHERE slug IS NOT NULL)
            )
        FROM public.profiles;
    ELSE
        INSERT INTO backup_auth_cleanup.analysis_results (analysis_type, description, count_value, details)
        VALUES ('profiles', 'Profiles table does not exist', 0, '{"table_exists": false}'::jsonb);
    END IF;
END $;

-- Analyze orphaned users (in auth.users but not in profiles)
DO $
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        INSERT INTO backup_auth_cleanup.analysis_results (analysis_type, description, count_value, details)
        SELECT 
            'orphaned_users',
            'Users in auth.users without profiles',
            COUNT(*),
            jsonb_agg(jsonb_build_object('id', au.id, 'email', au.email, 'metadata', au.raw_user_meta_data))
        FROM auth.users au
        LEFT JOIN public.profiles p ON au.id = p.id
        WHERE p.id IS NULL;
    END IF;
END $;

-- Analyze existing functions
INSERT INTO backup_auth_cleanup.analysis_results (analysis_type, description, count_value, details)
SELECT 
    'functions',
    'Authentication-related functions',
    COUNT(*),
    jsonb_agg(jsonb_build_object('function_name', proname, 'schema', nspname))
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE proname LIKE '%auth%' OR proname LIKE '%user%' OR proname LIKE '%profile%'
AND nspname IN ('public', 'auth');

-- Analyze existing triggers
INSERT INTO backup_auth_cleanup.analysis_results (analysis_type, description, count_value, details)
SELECT 
    'triggers',
    'Authentication-related triggers',
    COUNT(*),
    jsonb_agg(jsonb_build_object('trigger_name', tgname, 'table_name', relname))
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE tgname LIKE '%auth%' OR tgname LIKE '%user%' OR tgname LIKE '%profile%';

-- Analyze existing types (enums)
INSERT INTO backup_auth_cleanup.analysis_results (analysis_type, description, count_value, details)
SELECT 
    'types',
    'Custom types (enums)',
    COUNT(*),
    jsonb_agg(jsonb_build_object('type_name', typname, 'schema', nspname))
FROM pg_type t
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE typname LIKE '%role%' OR typname LIKE '%status%'
AND nspname = 'public';

-- Analyze table structures
DO $
DECLARE
    table_record RECORD;
    column_info JSONB;
BEGIN
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('profiles', 'roles', 'permissions', 'role_permissions', 'user_roles', 'mentor_profiles', 'validation_requests')
    LOOP
        SELECT jsonb_agg(
            jsonb_build_object(
                'column_name', column_name,
                'data_type', data_type,
                'is_nullable', is_nullable,
                'column_default', column_default
            )
        ) INTO column_info
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = table_record.table_name;
        
        INSERT INTO backup_auth_cleanup.analysis_results (analysis_type, description, count_value, details)
        VALUES (
            'table_structure',
            'Structure of ' || table_record.table_name,
            (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = table_record.table_name),
            jsonb_build_object('table_name', table_record.table_name, 'columns', column_info)
        );
    END LOOP;
END $;

-- =================================================================
-- 3. IDENTIFY CONFLICTS AND ISSUES
-- =================================================================

-- Check for duplicate functions
INSERT INTO backup_auth_cleanup.analysis_results (analysis_type, description, count_value, details)
SELECT 
    'duplicate_functions',
    'Functions with same name in different schemas or overloaded',
    COUNT(*),
    jsonb_agg(jsonb_build_object('function_name', proname, 'count', cnt))
FROM (
    SELECT proname, COUNT(*) as cnt
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE proname IN ('handle_new_user', 'custom_access_token_hook', 'update_updated_at_column', 'generate_profile_slug')
    AND nspname IN ('public', 'auth')
    GROUP BY proname
    HAVING COUNT(*) > 1
) duplicates;

-- Check for missing foreign key relationships
DO $
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        INSERT INTO backup_auth_cleanup.analysis_results (analysis_type, description, count_value, details)
        SELECT 
            'missing_fk_relationships',
            'Profiles without corresponding auth.users',
            COUNT(*),
            jsonb_agg(jsonb_build_object('profile_id', p.id, 'email', p.email))
        FROM public.profiles p
        LEFT JOIN auth.users au ON p.id = au.id
        WHERE au.id IS NULL;
    END IF;
END $;

-- Check for data type inconsistencies
INSERT INTO backup_auth_cleanup.analysis_results (analysis_type, description, count_value, details)
SELECT 
    'data_type_issues',
    'Columns with potential type issues',
    COUNT(*),
    jsonb_agg(jsonb_build_object('table_name', table_name, 'column_name', column_name, 'data_type', data_type))
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'roles', 'permissions', 'user_roles')
AND (
    (column_name = 'role' AND data_type != 'USER-DEFINED') OR
    (column_name = 'status' AND data_type != 'USER-DEFINED') OR
    (column_name LIKE '%_at' AND data_type NOT LIKE '%timestamp%')
);

-- =================================================================
-- 4. GENERATE SUMMARY REPORT
-- =================================================================

-- Create summary view
CREATE OR REPLACE VIEW backup_auth_cleanup.cleanup_analysis_summary AS
SELECT 
    analysis_type,
    description,
    count_value,
    details,
    created_at
FROM backup_auth_cleanup.analysis_results
ORDER BY 
    CASE analysis_type
        WHEN 'auth_users' THEN 1
        WHEN 'profiles' THEN 2
        WHEN 'orphaned_users' THEN 3
        WHEN 'functions' THEN 4
        WHEN 'triggers' THEN 5
        WHEN 'types' THEN 6
        WHEN 'table_structure' THEN 7
        WHEN 'duplicate_functions' THEN 8
        WHEN 'missing_fk_relationships' THEN 9
        WHEN 'data_type_issues' THEN 10
        ELSE 99
    END,
    description;

-- Display summary
SELECT 
    '=== MENVO AUTHENTICATION SYSTEM ANALYSIS ===' as report_section
UNION ALL
SELECT 
    'Analysis completed at: ' || NOW()::TEXT
UNION ALL
SELECT 
    '================================================'
UNION ALL
SELECT 
    analysis_type || ': ' || description || ' (' || count_value || ')'
FROM backup_auth_cleanup.cleanup_analysis_summary;

-- =================================================================
-- 5. BACKUP VERIFICATION
-- =================================================================

-- Verify backups were created successfully
SELECT 
    'BACKUP VERIFICATION:' as status,
    '' as details
UNION ALL
SELECT 
    'Table: ' || table_name,
    'Rows: ' || 
    CASE 
        WHEN table_name = 'auth_users_backup' THEN (SELECT COUNT(*)::TEXT FROM backup_auth_cleanup.auth_users_backup)
        WHEN table_name = 'profiles_backup' THEN 
            CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles_backup' AND table_schema = 'backup_auth_cleanup')
                THEN (SELECT COUNT(*)::TEXT FROM backup_auth_cleanup.profiles_backup)
                ELSE 'Table not found'
            END
        ELSE 'Unknown'
    END
FROM (
    SELECT 'auth_users_backup' as table_name
    UNION ALL
    SELECT 'profiles_backup'
) backup_tables;

-- Create restore script template
CREATE OR REPLACE FUNCTION backup_auth_cleanup.generate_restore_script()
RETURNS TEXT AS $
BEGIN
    RETURN '
-- RESTORE SCRIPT (USE ONLY IF NEEDED)
-- This script restores data from backups

-- Restore auth.users metadata (if needed)
-- UPDATE auth.users SET raw_user_meta_data = b.raw_user_meta_data
-- FROM backup_auth_cleanup.auth_users_backup b
-- WHERE auth.users.id = b.id;

-- Restore profiles (if needed)
-- INSERT INTO public.profiles SELECT * FROM backup_auth_cleanup.profiles_backup
-- ON CONFLICT (id) DO UPDATE SET
--   email = EXCLUDED.email,
--   first_name = EXCLUDED.first_name,
--   last_name = EXCLUDED.last_name,
--   -- ... other fields as needed

-- Note: Always test restore operations in a development environment first!
';
END;
$ LANGUAGE plpgsql;

-- Final message
SELECT 'Backup and analysis completed successfully!' as status;
SELECT 'Review the backup_auth_cleanup.cleanup_analysis_summary view for detailed analysis' as next_step;
SELECT 'Backup data is stored in backup_auth_cleanup schema' as backup_location;