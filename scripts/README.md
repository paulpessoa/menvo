# Scripts Directory

This directory contains development, testing, and maintenance scripts for the Menvo platform. Scripts are organized by category for better maintainability and discoverability.

## Directory Structure

```
scripts/
├── README.md                    # This file
├── setup/                      # User and system setup scripts
├── database/                   # Database operations and migrations
│   └── sql/                   # SQL files for database operations
├── testing/                    # Development testing and validation scripts
├── validation/                 # Configuration validation and diagnostics
├── maintenance/                # Backup and maintenance scripts
└── docs/                      # Documentation and setup guides
```

## Categories

### 🔧 Setup Scripts (`setup/`)
Scripts for creating users, initializing the system, and development setup.

- **setup-admin-and-mentors.js** - Creates admin user and initial mentors (npm: `setup-admin`)
- **setup-specific-users.js** - Creates specific users for development
- **create-test-users.js** - Creates test data for development
- **create-mentors-via-api.js** - Creates mentors via API endpoints

**Usage:**
```bash
npm run setup-admin                    # Setup admin and mentors
node scripts/setup/create-test-users.js    # Create test users
```

### 💾 Database Scripts (`database/`)
Scripts for database operations, migrations, and schema management.

- **migrate-users.js** - User migration system (npm: `migrate-users`)
- **check-database-schema.js** - Schema validation
- **apply-cascade-triggers.js** - Apply cascade delete triggers
- **check-and-recover-users.js** - User recovery utilities
- **switch-supabase-env.js** - Environment switching
- **sync-production-data.js** - Data synchronization

**SQL Files (`database/sql/`):**
- **check-missing-profiles.sql** - Find profiles missing from users
- **check-volunteer-tables.sql** - Validate volunteer table structure
- **create-mentors.sql** - SQL for creating mentor records
- **fix-trigger.sql** - Fix database triggers
- **verify-mentors.sql** - Verify mentor data integrity

**Usage:**
```bash
npm run migrate-users                           # Run user migration
node scripts/database/check-database-schema.js  # Check schema
node scripts/database/apply-cascade-triggers.js # Apply triggers
```

### 🧪 Testing Scripts (`testing/`)
Scripts for development testing, integration tests, and validation.

- **test-oauth-fixes.js** - OAuth provider testing
- **test-auth-flow.js** - Authentication flow testing
- **test-supabase-connection.js** - Database connectivity testing
- **test-backup-restore.js** - Backup system testing
- **test-register-endpoint.js** - Registration endpoint testing
- **test-registration-flow.js** - Complete registration workflow testing
- **test-google-calendar.js** - Google Calendar integration testing
- **test-volunteer-endpoints.ts** - Volunteer endpoints testing

**Usage:**
```bash
node scripts/testing/test-oauth-fixes.js        # Test OAuth providers
node scripts/testing/test-auth-flow.js          # Test auth flow
node scripts/testing/test-supabase-connection.js # Test DB connection
```

### ✅ Validation Scripts (`validation/`)
Scripts for configuration validation and production readiness checks.

- **validate-oauth-config.js** - OAuth configuration validation (referenced in UI)
- **diagnose-auth-issues.js** - Authentication troubleshooting
- **validate-auth-issues.js** - Authentication issues validation
- **check-production-status.js** - Production environment validation
- **check-supabase-config.js** - Supabase configuration checking

**Usage:**
```bash
node scripts/validation/validate-oauth-config.js status  # Check OAuth config
node scripts/validation/diagnose-auth-issues.js         # Diagnose auth issues
node scripts/validation/check-production-status.js      # Check prod status
```

### 🔧 Maintenance Scripts (`maintenance/`)
Scripts for backup, data sync, and environment management.

- **backup-supabase.ps1** - Database backup system (PowerShell)
- **get-refresh-token.js** - Token management utilities

**Usage:**
```bash
# Windows PowerShell
./scripts/maintenance/backup-supabase.ps1

# Token management
node scripts/maintenance/get-refresh-token.js
```

### 📚 Documentation (`docs/`)
Setup guides and usage documentation.

- **google-auth-instructions.md** - Google OAuth setup guide
- **manage-mentors.md** - Mentor management guide
- **profile-management-guide.md** - Profile management documentation
- **setup-google-calendar.md** - Google Calendar setup instructions

## NPM Scripts

The following scripts are available via npm/yarn:

```bash
npm run migrate-users    # Run user migration system
npm run setup-admin      # Setup admin user and initial mentors
```

## Environment Requirements

Most scripts require environment variables to be configured:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OAuth Providers (for OAuth testing)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Development Workflow

### Setting Up Development Environment
1. Run `npm run setup-admin` to create admin user and mentors
2. Run `node scripts/setup/create-test-users.js` to create test data
3. Use validation scripts to verify configuration

### Testing OAuth Configuration
1. Run `node scripts/validation/validate-oauth-config.js status`
2. Run `node scripts/testing/test-oauth-fixes.js` to test providers
3. Check UI with OAuth validator component

### Database Operations
1. Use `npm run migrate-users` for user migrations
2. Run schema validation with `node scripts/database/check-database-schema.js`
3. Apply triggers with `node scripts/database/apply-cascade-triggers.js`

### Troubleshooting
1. Use `node scripts/validation/diagnose-auth-issues.js` for auth problems
2. Check database connectivity with `node scripts/testing/test-supabase-connection.js`
3. Validate production readiness with `node scripts/validation/check-production-status.js`

## Security Notes

- Scripts with database access use service role keys - keep them secure
- Test scripts should only be run in development environments
- Production scripts require explicit confirmation before execution
- Always backup data before running destructive operations

## Contributing

When adding new scripts:

1. Place them in the appropriate category folder
2. Add consistent header documentation
3. Update this README with script description
4. Add usage examples
5. Include environment variable requirements
6. Test in development environment first

## Recent Changes

This directory was reorganized for better maintainability:
- Scripts categorized into logical folders
- Removed redundant scripts (setup-users-direct.js, setup-users-simple.js)
- Updated all references to new file paths
- Added comprehensive documentation