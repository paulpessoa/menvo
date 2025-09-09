# Auth Role Selection Flow Test

## Test Scenarios

### 1. New User Registration Flow
**Expected Flow:**
1. User registers with email/password or OAuth
2. User confirms email (if email registration)
3. User is redirected to `/auth/select-role`
4. User selects "mentor" or "mentee"
5. User is redirected to appropriate dashboard:
   - Mentor → `/dashboard/mentor`
   - Mentee → `/dashboard/mentee`

### 2. Existing User Without Role
**Expected Flow:**
1. User logs in
2. AuthGuard detects no role
3. User is redirected to `/auth/select-role`
4. User selects role
5. User is redirected to appropriate dashboard

### 3. User Accessing Protected Pages Without Role
**Expected Flow:**
1. User tries to access `/dashboard` or any protected page
2. AuthGuard with `requireRole=true` detects no role
3. User is redirected to `/auth/select-role`
4. After role selection, user can access protected pages

### 4. OAuth Callback Flow
**Expected Flow:**
1. User completes OAuth (Google/LinkedIn)
2. Callback route checks for existing role
3. If no role: redirect to `/auth/select-role`
4. If has role: redirect to `/dashboard` (which then redirects to role-specific dashboard)

### 5. Email Confirmation Flow
**Expected Flow:**
1. User clicks email confirmation link
2. Callback route verifies token
3. For signup confirmation: redirect to `/auth/select-role`
4. For other types: redirect appropriately

## Implementation Verification

### ✅ Components Created
- [x] `/app/auth/select-role/page.tsx` - Role selection page
- [x] `/app/dashboard/mentor/page.tsx` - Mentor dashboard
- [x] `/app/dashboard/mentee/page.tsx` - Mentee dashboard
- [x] `/app/dashboard/admin/page.tsx` - Admin dashboard
- [x] Updated `/app/dashboard/page.tsx` - Main dashboard redirector

### ✅ AuthGuard Logic
- [x] Redirects to `/auth/select-role` when `requireRole=true` and user has no role
- [x] Allows access when user has appropriate role
- [x] Shows verification pending message for unverified mentors

### ✅ Auth Context Integration
- [x] Role selection page uses `selectRole()` method from auth context
- [x] Proper error handling with `handleAuthError()`
- [x] Updates user_roles table correctly
- [x] Refreshes JWT custom claims

### ✅ Callback Route Integration
- [x] OAuth callback checks for role and redirects appropriately
- [x] Email confirmation redirects to role selection for new users
- [x] Other email types redirect appropriately

## Manual Testing Checklist

### Test 1: Email Registration
- [ ] Register with email/password
- [ ] Confirm email via link
- [ ] Should redirect to role selection
- [ ] Select mentor role
- [ ] Should redirect to mentor dashboard
- [ ] Verify mentor shows "verification pending" status

### Test 2: OAuth Registration
- [ ] Register with Google/LinkedIn
- [ ] Should redirect to role selection
- [ ] Select mentee role
- [ ] Should redirect to mentee dashboard

### Test 3: Existing User Login
- [ ] Login with existing user (no role)
- [ ] Should redirect to role selection
- [ ] Select role
- [ ] Should redirect to appropriate dashboard

### Test 4: Protected Page Access
- [ ] Try to access `/dashboard` without role
- [ ] Should redirect to role selection
- [ ] Complete role selection
- [ ] Should be able to access dashboard

### Test 5: Role-Specific Access
- [ ] Login as mentor
- [ ] Try to access mentee-only pages
- [ ] Should show access denied or redirect
- [ ] Verify role-specific dashboard content

## Expected Database State

After role selection, the database should have:

\`\`\`sql
-- User in auth.users (created by Supabase)
-- Profile in profiles table (created by trigger)
-- Role assignment in user_roles table
SELECT 
  p.id,
  p.email,
  p.full_name,
  r.name as role,
  p.verified
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE p.id = 'user-id';
\`\`\`

## Error Scenarios to Test

### Invalid Role Selection
- [ ] Try to submit without selecting a role
- [ ] Should show validation error

### Network Errors
- [ ] Simulate network error during role selection
- [ ] Should show appropriate error message
- [ ] Should allow retry

### Already Has Role
- [ ] User with existing role accesses role selection page
- [ ] Should redirect to appropriate dashboard

### Unauthenticated Access
- [ ] Try to access role selection page without login
- [ ] Should redirect to login page
