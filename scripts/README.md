# Menvo Authentication Scripts

This directory contains the consolidated authentication system scripts for the Menvo platform.

## Current Active Scripts

### Core Schema Scripts
- **`consolidated_auth_schema.sql`** - Main authentication schema (USE THIS)
  - Complete authentication system with RBAC
  - Replaces all previous conflicting scripts
  - Includes users, roles, permissions, and JWT customization

### Legacy Reference Scripts (Keep for reference)
- **`001-initial-schema.sql`** - Original schema (reference only)
- **`002-seed-data.sql`** - Original seed data (reference only)
- **`setup_jwt_hook.sql`** - JWT hook setup (reference only)

### Utility Scripts
- **`backup_and_analysis.sql`** - Database backup and analysis
- **`setup_storage.sql`** - Storage bucket configuration
- **`setup_supabase.sql`** - Supabase configuration
- **`fix_storage_bucket.sql`** - Storage fixes
- **`fix_volunteer_tables.sql`** - Volunteer table fixes

### Documentation
- **`CURRENT_STATE_ANALYSIS.md`** - Analysis of previous system state

## Archived Scripts

All redundant and conflicting scripts have been moved to the `archive/` folder:
- Migration scripts
- Fix/patch scripts  
- Alternative implementations
- Duplicate setups

## Usage Instructions

### For New Installations
1. Run `consolidated_auth_schema.sql` - This creates the complete authentication system

### For Existing Installations
1. First run `backup_and_analysis.sql` to backup existing data
2. Then run `consolidated_auth_schema.sql` to create the new unified system
3. Migrate existing data as needed

### JWT Hook Configuration
After running the schema script, configure the JWT hook in Supabase:
1. Go to Authentication > Hooks in Supabase dashboard
2. Add "Customize Access Token (JWT) Claims" hook
3. Select `public.custom_access_token_hook` function

## Authentication Flow

### Registration Options
1. **Email/Password**: Collects email, password, first_name, last_name, user_type
2. **OAuth (Google/LinkedIn)**: Extracts metadata, then shows role selection

### User Roles
- `pending` - OAuth users who haven't selected a role
- `mentee` - Users seeking mentorship (public registration)
- `mentor` - Users providing mentorship (public registration, requires validation)
- `admin` - System administrators (manual assignment only)
- `volunteer` - Platform volunteers (manual assignment only)
- `moderator` - Content moderators (manual assignment only)

### Verification Flow
- **Mentees**: Immediately active after email confirmation
- **Mentors**: Require validation by admins/moderators
- **Others**: Active immediately (admin-assigned roles)

## Database Tables

### Core Tables
- `profiles` - User profile information
- `roles` - System roles
- `permissions` - System permissions
- `role_permissions` - Role-permission mappings
- `user_roles` - User-role assignments
- `validation_requests` - Mentor validation requests

### Key Functions
- `handle_new_user()` - Processes new user registration
- `custom_access_token_hook()` - Adds custom claims to JWT
- `get_user_permissions()` - Gets user permissions array
- `user_has_permission()` - Checks specific permission

## Security Features

- Row Level Security (RLS) enabled on all tables
- JWT tokens include role, status, and permissions
- Proper foreign key constraints
- Secure function definitions with SECURITY DEFINER

## Migration Notes

The consolidated script:
- ✅ Removes all conflicting functions and triggers
- ✅ Creates unified RBAC system
- ✅ Handles both OAuth and email/password registration
- ✅ Includes proper JWT customization
- ✅ Sets up comprehensive RLS policies
- ✅ Creates performance indexes

## Support

For issues or questions about the authentication system:
1. Check the analysis results from `backup_and_analysis.sql`
2. Review the `CURRENT_STATE_ANALYSIS.md` documentation
3. Consult the archived scripts for historical context