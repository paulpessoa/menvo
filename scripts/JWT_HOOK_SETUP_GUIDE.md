# JWT Hook Setup Guide for Supabase

This guide explains how to configure the custom JWT access token hook in Supabase after running the consolidated authentication schema.

## Prerequisites

1. ✅ Run `consolidated_auth_schema.sql` to create the authentication system
2. ✅ Verify the `custom_access_token_hook()` function exists
3. ✅ Ensure `supabase_auth_admin` has execute permissions on the function

## Step-by-Step Configuration

### 1. Access Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** in the left sidebar
3. Click on **Hooks** in the Authentication submenu

### 2. Create JWT Claims Hook

1. Click **"Add Hook"** or **"Create Hook"**
2. Select **"Customize Access Token (JWT) Claims"** as the hook type
3. Configure the hook with these settings:

   ```
   Hook Name: Custom JWT Claims
   Hook Type: Customize Access Token (JWT) Claims
   Function Type: Postgres Function
   Schema: public
   Function: custom_access_token_hook
   ```

### 3. Verify Hook Configuration

After creating the hook, verify it's working:

1. The hook should appear in your hooks list
2. Status should show as "Active" or "Enabled"
3. Test with a user login to verify JWT tokens include custom claims

## JWT Token Structure

After configuration, JWT tokens will include these custom claims:

```json
{
  "aud": "authenticated",
  "exp": 1234567890,
  "iat": 1234567890,
  "iss": "https://your-project.supabase.co/auth/v1",
  "sub": "user-uuid-here",
  "email": "user@example.com",
  "role": "mentee",           // Custom claim
  "status": "active",         // Custom claim  
  "permissions": [            // Custom claim
    "view_mentors",
    "book_sessions"
  ],
  "user_id": "user-uuid-here" // Custom claim
}
```

## Custom Claims Explanation

### `role` Claim
- **Values**: `pending`, `mentee`, `mentor`, `admin`, `volunteer`, `moderator`
- **Usage**: Determines user's primary role in the system
- **Frontend**: Use for role-based UI rendering and navigation

### `status` Claim  
- **Values**: `pending`, `active`, `suspended`, `rejected`
- **Usage**: Indicates account status
- **Frontend**: Use to show account status messages or restrictions

### `permissions` Claim
- **Type**: Array of permission strings
- **Usage**: Granular permissions based on user's role
- **Frontend**: Use for feature-level access control

### `user_id` Claim
- **Type**: UUID string
- **Usage**: Redundant user ID for convenience
- **Frontend**: Quick access to user ID without parsing `sub`

## Frontend Integration

### JavaScript/TypeScript Example

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)

// Get current session with custom claims
const { data: { session } } = await supabase.auth.getSession()

if (session?.access_token) {
  // Decode JWT to access custom claims
  const payload = JSON.parse(atob(session.access_token.split('.')[1]))
  
  console.log('User role:', payload.role)
  console.log('User status:', payload.status)
  console.log('User permissions:', payload.permissions)
  
  // Use claims for access control
  const canViewMentors = payload.permissions?.includes('view_mentors')
  const isAdmin = payload.role === 'admin'
  const isActive = payload.status === 'active'
}
```

### React Hook Example

```typescript
import { useEffect, useState } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'

interface UserClaims {
  role: string
  status: string
  permissions: string[]
  user_id: string
}

export function useUserClaims() {
  const [claims, setClaims] = useState<UserClaims | null>(null)
  const supabase = useSupabaseClient()
  const user = useUser()

  useEffect(() => {
    if (user) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.access_token) {
          const payload = JSON.parse(atob(session.access_token.split('.')[1]))
          setClaims({
            role: payload.role || 'pending',
            status: payload.status || 'pending', 
            permissions: payload.permissions || [],
            user_id: payload.user_id || payload.sub
          })
        }
      })
    } else {
      setClaims(null)
    }
  }, [user, supabase])

  return claims
}
```

## Testing the Hook

### 1. Manual Testing

1. Create a test user through your application
2. Log in with the test user
3. Inspect the JWT token in browser developer tools
4. Verify custom claims are present

### 2. Automated Testing

Run the test script to validate hook functionality:

```sql
-- Run this in Supabase SQL Editor
\i test_jwt_hook_function.sql
```

### 3. Frontend Testing

```typescript
// Test function to verify JWT claims
async function testJWTClaims() {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session?.access_token) {
    const payload = JSON.parse(atob(session.access_token.split('.')[1]))
    
    console.log('JWT Claims Test Results:')
    console.log('✓ Role:', payload.role)
    console.log('✓ Status:', payload.status) 
    console.log('✓ Permissions:', payload.permissions)
    console.log('✓ User ID:', payload.user_id)
    
    return payload
  }
  
  throw new Error('No active session found')
}
```

## Troubleshooting

### Hook Not Working

1. **Check Function Exists**:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'custom_access_token_hook';
   ```

2. **Check Permissions**:
   ```sql
   SELECT grantee, privilege_type 
   FROM information_schema.routine_privileges 
   WHERE routine_name = 'custom_access_token_hook';
   ```

3. **Check Hook Configuration**:
   - Verify hook is enabled in Supabase dashboard
   - Ensure correct schema (public) and function name

### Claims Not Appearing

1. **User Profile Missing**:
   ```sql
   SELECT * FROM profiles WHERE id = 'user-uuid-here';
   ```

2. **Role Assignment Missing**:
   ```sql
   SELECT ur.*, r.name as role_name 
   FROM user_roles ur 
   JOIN roles r ON ur.role_id = r.id 
   WHERE ur.user_id = 'user-uuid-here';
   ```

3. **Permissions Not Mapped**:
   ```sql
   SELECT p.name 
   FROM user_roles ur
   JOIN role_permissions rp ON ur.role_id = rp.role_id
   JOIN permissions p ON rp.permission_id = p.id
   WHERE ur.user_id = 'user-uuid-here';
   ```

### Performance Issues

1. **Add Database Indexes** (already included in schema):
   ```sql
   CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
   CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
   ```

2. **Monitor Function Performance**:
   ```sql
   SELECT * FROM pg_stat_user_functions 
   WHERE funcname = 'custom_access_token_hook';
   ```

## Security Considerations

1. **Function Security**: The function is marked as `SECURITY DEFINER` to run with elevated privileges
2. **Permission Validation**: Always validate permissions on the backend, not just frontend
3. **Token Expiration**: JWT tokens expire and refresh automatically
4. **Sensitive Data**: Never include sensitive data in JWT claims (they are base64 encoded, not encrypted)

## Maintenance

### Updating Permissions

When adding new permissions:

1. Insert new permission in `permissions` table
2. Map to appropriate roles in `role_permissions` table
3. JWT tokens will automatically include new permissions on next login

### Role Changes

When users change roles:

1. Update `profiles.role` field
2. Update `user_roles` assignments
3. User must log out and back in to get updated JWT claims

## Support

If you encounter issues:

1. Check the test scripts in `/scripts/` directory
2. Review the function implementation in `consolidated_auth_schema.sql`
3. Verify Supabase dashboard configuration
4. Test with the provided validation scripts