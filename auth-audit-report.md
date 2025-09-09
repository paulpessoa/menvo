# Authentication System Audit Report

## Current Authentication Files Inventory

### Hooks (Multiple Conflicting Implementations)
1. **hooks/useAuth.ts** - Basic auth with signIn/signOut/getCurrentUser
2. **lib/auth/use-auth.ts** - Extended auth with helper methods
3. **lib/auth/auth-context.tsx** - Main context with comprehensive auth state
4. **hooks/usePermissions.ts** - Separate permission system
5. **hooks/useRoleManagement.ts** - Complex role management with React Query
6. **hooks/useRoleSelection.ts** - Another role selection implementation

### Services (Duplicated Logic)
1. **services/auth/roleService.ts** - JWT-based role management
2. **services/auth/userService.ts** - Database-based user operations
3. **services/auth/supabase.ts** - Basic Supabase client

### API Endpoints (Redundant)
1. **app/api/auth/me/route.ts** - Get current user
2. **app/api/auth/select-role/route.ts** - Role selection (primary)
3. **app/api/auth/update-role/route.ts** - Role update (duplicate)
4. **app/api/auth/custom-claims/** - JWT claims management
5. Multiple OAuth endpoints and diagnostics

### Components (Scattered Auth Logic)
1. **components/auth/login-form.tsx**
2. **components/auth/register-form.tsx**
3. **components/auth/RoleSelectionModal.tsx**
4. **components/auth/UserTypeSelector.tsx**
5. **lib/auth/auth-guard.tsx**

### Utilities (Complex Redirect Logic)
1. **lib/auth-redirect.ts** - Overly complex redirect logic
2. **lib/auth/oauth-*.ts** - OAuth configuration files

## Data Flow Analysis

### Current Problematic Flow:
\`\`\`
User Login → Multiple Auth Contexts → Conflicting State → Role Confusion → Redirect Issues
\`\`\`

### Issues Identified:
1. **State Conflicts**: Multiple sources of truth for user state
2. **Role Confusion**: Different systems managing roles differently
3. **Permission Chaos**: Overlapping permission systems
4. **Redirect Hell**: Complex redirect logic causing loops
5. **API Duplication**: Multiple endpoints doing same thing

## Database Schema (Current - Simplified)
\`\`\`sql
profiles (✓ Good - Keep)
├── id, email, first_name, last_name, full_name
├── avatar_url, bio, verified
└── created_at, updated_at

roles (✓ Good - Keep)  
├── id, name ('mentor', 'mentee', 'admin')

user_roles (✓ Good - Keep)
├── user_id, role_id, assigned_at
\`\`\`

## Redundancies to Remove

### 1. Duplicate Hooks
- Remove: useRoleManagement, useRoleSelection, usePermissions
- Keep: Consolidated useAuth

### 2. Duplicate Services  
- Remove: Complex roleService JWT logic, userService
- Keep: Simple database-based auth service

### 3. Duplicate APIs
- Remove: update-role, custom-claims
- Keep: me, select-role

### 4. Complex Logic
- Remove: Complex redirect logic, profile completion checks
- Keep: Simple role-based redirects

## Recommended Consolidation Strategy

### Single Source of Truth:
\`\`\`
AuthProvider (Context) 
└── useAuth (Single Hook)
    ├── User State Management
    ├── Role Management  
    ├── Simple Permissions
    └── Basic Redirects
\`\`\`

### Simplified Permission Matrix:
\`\`\`
Role    | Actions
--------|------------------
mentee  | view_mentors, book_sessions
mentor  | view_mentors, book_sessions, provide_mentorship
admin   | ALL permissions
\`\`\`

## Files to Delete/Modify

### DELETE:
- hooks/useRoleManagement.ts
- hooks/useRoleSelection.ts  
- hooks/usePermissions.ts
- services/auth/userService.ts
- app/api/auth/update-role/
- app/api/auth/custom-claims/

### SIMPLIFY:
- lib/auth/auth-context.tsx (consolidate all auth logic)
- hooks/useAuth.ts (make it the single hook)
- lib/auth-redirect.ts (basic role-based redirects only)
- services/auth/roleService.ts (database-only, no JWT complexity)

### KEEP AS-IS:
- Database schema (profiles, roles, user_roles)
- app/api/auth/me/route.ts
- app/api/auth/select-role/route.ts (simplified)
