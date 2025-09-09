# Scripts Directory Inventory

## Analysis Date
$(date)

## Total Files: 45

## Category Analysis

### 🔧 SETUP SCRIPTS (6 files)
**Purpose**: User creation, system initialization, development setup

1. **setup-admin-and-mentors.js** ✅ KEEP (npm script: setup-admin)
   - Creates admin user and initial mentors
   - Referenced in package.json

2. **setup-specific-users.js** ⚠️ CONSOLIDATE
   - Creates specific users for development
   - Similar to other setup scripts

3. **setup-users-direct.js** ❌ REMOVE (redundant)
   - Direct user setup (overlaps with setup-specific-users.js)

4. **setup-users-simple.js** ❌ REMOVE (redundant)
   - Simple user setup (overlaps with setup-specific-users.js)

5. **create-test-users.js** ✅ KEEP
   - Creates test data for development

6. **create-mentors-via-api.js** ⚠️ EVALUATE
   - Creates mentors via API (may overlap with setup-admin-and-mentors.js)

### 💾 DATABASE SCRIPTS (8 files)
**Purpose**: Database operations, migrations, schema management

1. **migrate-users.js** ✅ KEEP (npm script: migrate-users)
   - User migration system
   - Referenced in package.json and API routes

2. **check-database-schema.js** ✅ KEEP
   - Schema validation

3. **apply-cascade-triggers.js** ✅ KEEP
   - Referenced in documentation

4. **check-and-recover-users.js** ✅ KEEP
   - User recovery utilities

5. **switch-supabase-env.js** ✅ KEEP
   - Environment switching

6. **sync-production-data.js** ✅ KEEP
   - Data synchronization

7. **check-supabase-config.js** ⚠️ EVALUATE
   - Configuration checking

8. **check-production-status.js** ✅ KEEP
   - Production status validation

### 📊 SQL FILES (7 files)
**Purpose**: Database queries, schema updates, fixes

1. **check-missing-profiles.sql** ✅ KEEP
2. **check-production-trigger.sql** ✅ KEEP
3. **check-volunteer-tables.sql** ✅ KEEP (referenced in API)
4. **create-mentors.sql** ✅ KEEP
5. **create-missing-profiles.sql** ✅ KEEP
6. **fix-trigger.sql** ✅ KEEP
7. **fix-volunteer-rls.sql** ✅ KEEP
8. **test-rls-policies.sql** ✅ KEEP
9. **verify-mentors.sql** ✅ KEEP

### 🧪 TESTING SCRIPTS (14 files)
**Purpose**: Development testing, integration tests, validation

1. **test-oauth-fixes.js** ✅ KEEP
   - OAuth provider testing

2. **validate-oauth-config.js** ✅ KEEP
   - Referenced in UI components

3. **test-auth-flow.js** ✅ KEEP
   - Authentication flow testing

4. **test-supabase-connection.js** ✅ KEEP
   - Database connectivity testing

5. **diagnose-auth-issues.js** ✅ KEEP
   - Authentication troubleshooting

6. **validate-auth-issues.js** ⚠️ EVALUATE (similar to diagnose-auth-issues.js)

7. **test-backup-restore.js** ✅ KEEP
   - Backup system testing

8. **test-cascade-delete.js** ✅ KEEP
   - Cascade delete testing

9. **test-email-flow.js** ✅ KEEP
   - Email functionality testing

10. **test-google-calendar.js** ✅ KEEP
    - Google Calendar integration testing

11. **test-local-db.js** ✅ KEEP
    - Local database testing

12. **test-profile-update.js** ⚠️ EVALUATE
    - Profile update testing

13. **test-register-endpoint.js** ⚠️ EVALUATE
    - Registration endpoint testing

14. **test-registration-flow.js** ⚠️ EVALUATE (similar to test-register-endpoint.js)

15. **test-role-redirection.js** ⚠️ EVALUATE
    - Role redirection testing

16. **test-role-selection.js** ⚠️ EVALUATE
    - Role selection testing

17. **test-volunteer-endpoints.ts** ✅ KEEP
    - Volunteer endpoints testing

### 🔧 MAINTENANCE SCRIPTS (3 files)
**Purpose**: Backup, data sync, environment management

1. **backup-supabase.ps1** ✅ KEEP
   - Database backup system

2. **get-refresh-token.js** ✅ KEEP
   - Token management

### 📚 DOCUMENTATION (4 files)
**Purpose**: Setup guides, usage documentation

1. **google-auth-instructions.md** ✅ KEEP
2. **manage-mentors.md** ✅ KEEP
3. **profile-management-guide.md** ✅ KEEP
4. **README-data-sync.md** ⚠️ EVALUATE (may be outdated)

## Usage References

### NPM Scripts (package.json)
- `migrate-users`: scripts/migrate-users.js
- `setup-admin`: scripts/setup-admin-and-mentors.js

### Code References
- `validate-oauth-config.js`: Referenced in components/auth/oauth-validator.tsx
- `apply-cascade-triggers.js`: Referenced in docs/cascade-delete-triggers.md
- `check-volunteer-tables.sql`: Referenced in app/api/admin/check-tables/route.ts
- `migrate-users.js`: Referenced in app/api/admin/run-migration/route.ts

### Documentation References
- Various scripts referenced in documentation files

## Consolidation Opportunities

### Similar Setup Scripts
- `setup-specific-users.js`, `setup-users-simple.js`, `setup-users-direct.js`
- **Action**: Keep setup-specific-users.js, remove others

### Similar Test Scripts
- `test-register-endpoint.js` vs `test-registration-flow.js`
- `validate-auth-issues.js` vs `diagnose-auth-issues.js`
- **Action**: Consolidate similar functionality

### Potentially Outdated
- `README-data-sync.md`: May be outdated
- Some test scripts may be redundant

## Recommended Actions

### REMOVE (4 files)
- setup-users-direct.js (redundant)
- setup-users-simple.js (redundant)
- test-registration-flow.js (if similar to test-register-endpoint.js)
- README-data-sync.md (if outdated)

### CONSOLIDATE (3 pairs)
- Keep setup-specific-users.js, merge features from removed setup scripts
- Merge validate-auth-issues.js into diagnose-auth-issues.js
- Evaluate test-register-endpoint.js vs test-registration-flow.js

### ORGANIZE INTO FOLDERS
- setup/ (6 files)
- database/ (8 files + sql subfolder)
- testing/ (10-12 files after consolidation)
- maintenance/ (3 files)
- docs/ (3-4 files)

## Final Count Estimate
- **Current**: 45 files
- **After cleanup**: ~38-40 files
- **Reduction**: ~5-7 files (11-15% reduction)
- **Better organization**: 5 categorized folders
