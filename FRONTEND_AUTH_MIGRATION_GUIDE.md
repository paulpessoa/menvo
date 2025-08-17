# Frontend Authentication Migration Guide

This guide explains how to migrate from the old conflicting authentication implementations to the new consolidated system.

## Overview

The new consolidated authentication system provides:
- ✅ Single source of truth for authentication state
- ✅ JWT claims extraction for permissions
- ✅ Unified hook interface
- ✅ Better TypeScript support
- ✅ Consistent error handling
- ✅ Proper loading states

## Migration Steps

### Step 1: Replace useAuth Hook

**Old Implementation (hooks/useAuth.tsx):**
```typescript
import { useAuth } from "@/hooks/useAuth"

const { user, loading, isAuthenticated, profile } = useAuth()
```

**New Implementation:**
```typescript
import { useAuth } from "@/hooks/useAuth.consolidated"

const { 
  user, 
  loading, 
  isAuthenticated, 
  profile, 
  claims,
  hasRole,
  hasPermission 
} = useAuth()
```

### Step 2: Replace AuthContext

**Old Implementation (app/context/auth-context.tsx):**
```typescript
import { useAuth } from "@/app/context/auth-context"

const { user, profile, role, permissions, loading } = useAuth()
```

**New Implementation:**
```typescript
import { useAuth } from "@/hooks/useAuth.consolidated"

const { 
  user, 
  profile, 
  claims, 
  loading,
  hasRole,
  hasPermission 
} = useAuth()

// Access role and permissions through claims or helper methods
const role = claims?.role || profile?.role
const permissions = claims?.permissions || []
```

### Step 3: Replace usePermissions Hook

**Old Implementation (hooks/usePermissions.ts):**
```typescript
import { usePermissions } from "@/hooks/usePermissions"

const { 
  hasPermission, 
  hasRole, 
  isAdmin, 
  isMentor, 
  isMentee 
} = usePermissions()
```

**New Implementation:**
```typescript
import { usePermissions } from "@/hooks/usePermissions.consolidated"

const { 
  hasPermission, 
  hasRole, 
  isAdmin, 
  isMentor, 
  isMentee,
  canViewMentors,
  canAdminUsers,
  isActive,
  needsVerification
} = usePermissions()
```

## Key Differences

### 1. JWT Claims Integration

**Old:** Permissions were not extracted from JWT tokens
```typescript
// Old - permissions were empty or hardcoded
const { permissions } = useAuth() // Always []
```

**New:** Permissions come from JWT claims
```typescript
// New - permissions extracted from JWT
const { claims } = useAuth()
const permissions = claims?.permissions || []
```

### 2. Better Type Safety

**Old:** Loose typing
```typescript
const profile: any = useAuth().profile
```

**New:** Strong typing
```typescript
const profile: UserProfile | null = useAuth().profile
```

### 3. Enhanced Permission Checking

**Old:** Basic permission checking
```typescript
const canAdmin = permissions.includes('admin_users')
```

**New:** Multiple checking methods
```typescript
const { 
  hasPermission,
  canAdminUsers,
  hasAllPermissions,
  hasAnyPermission 
} = usePermissions()

const canAdmin = hasPermission('admin_users') || canAdminUsers
```

### 4. Status and Verification Checks

**Old:** Manual status checking
```typescript
const needsVerification = profile?.verification_status === 'pending_validation'
```

**New:** Built-in helpers
```typescript
const { needsVerification, isActive, isVerified } = usePermissions()
```

## Component Migration Examples

### Example 1: Basic Authentication Check

**Before:**
```typescript
import { useAuth } from "@/app/context/auth-context"

export function MyComponent() {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please login</div>
  
  return <div>Authenticated content</div>
}
```

**After:**
```typescript
import { useAuth } from "@/hooks/useAuth.consolidated"

export function MyComponent() {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please login</div>
  
  return <div>Authenticated content</div>
}
```

### Example 2: Permission-Based Rendering

**Before:**
```typescript
import { usePermissions } from "@/hooks/usePermissions"

export function AdminPanel() {
  const { hasPermission, loading } = usePermissions()
  
  if (loading) return <div>Loading...</div>
  if (!hasPermission('admin_users')) return <div>Access denied</div>
  
  return <div>Admin content</div>
}
```

**After:**
```typescript
import { usePermissions } from "@/hooks/usePermissions.consolidated"

export function AdminPanel() {
  const { canAdminUsers, loading } = usePermissions()
  
  if (loading) return <div>Loading...</div>
  if (!canAdminUsers) return <div>Access denied</div>
  
  return <div>Admin content</div>
}
```

### Example 3: Role-Based Navigation

**Before:**
```typescript
import { useAuth } from "@/app/context/auth-context"

export function Navigation() {
  const { role } = useAuth()
  
  return (
    <nav>
      {role === 'admin' && <Link href="/admin">Admin</Link>}
      {role === 'mentor' && <Link href="/mentor">Mentor</Link>}
    </nav>
  )
}
```

**After:**
```typescript
import { usePermissions } from "@/hooks/usePermissions.consolidated"

export function Navigation() {
  const { isAdmin, isMentor, canAdminUsers } = usePermissions()
  
  return (
    <nav>
      {canAdminUsers && <Link href="/admin">Admin</Link>}
      {isMentor && <Link href="/mentor">Mentor</Link>
    </nav>
  )
}
```

### Example 4: Profile Management

**Before:**
```typescript
import { useAuth } from "@/hooks/useAuth"

export function ProfileForm() {
  const { profile, fetchUserProfile } = useAuth()
  
  const handleUpdate = async (data) => {
    // Manual profile update logic
    await updateProfile(data)
    await fetchUserProfile(profile.id)
  }
  
  return <form onSubmit={handleUpdate}>...</form>
}
```

**After:**
```typescript
import { useAuth } from "@/hooks/useAuth.consolidated"

export function ProfileForm() {
  const { profile, updateProfile } = useAuth()
  
  const handleUpdate = async (data) => {
    // Built-in profile update with auto-refresh
    await updateProfile(data)
  }
  
  return <form onSubmit={handleUpdate}>...</form>
}
```

## File Replacement Plan

### Files to Replace

1. **hooks/useAuth.tsx** → **hooks/useAuth.consolidated.tsx**
2. **app/context/auth-context.tsx** → Remove (functionality moved to consolidated hook)
3. **hooks/usePermissions.ts** → **hooks/usePermissions.consolidated.ts**

### Files to Update

1. **components/auth/AuthGuard.tsx** - Update imports
2. **components/auth/ProtectedRoute.tsx** - Update imports  
3. **app/layout.tsx** - Remove AuthProvider, update imports
4. **All components using authentication** - Update imports and usage

## Step-by-Step Migration Process

### Phase 1: Install New Hooks (No Breaking Changes)

1. Keep existing files
2. Add new consolidated files with `.consolidated` suffix
3. Test new hooks in isolation

### Phase 2: Migrate Components One by One

1. Update one component at a time
2. Test each component thoroughly
3. Verify permissions work correctly

### Phase 3: Replace Old Files

1. Rename consolidated files to remove `.consolidated` suffix
2. Delete old implementation files
3. Update all remaining imports

### Phase 4: Clean Up

1. Remove unused dependencies
2. Update TypeScript types
3. Run full test suite

## Testing Checklist

- [ ] Authentication state persists across page refreshes
- [ ] JWT claims are properly extracted and used
- [ ] Permissions are correctly checked from JWT tokens
- [ ] Role-based access control works
- [ ] OAuth flows work (Google, LinkedIn)
- [ ] Email/password registration works
- [ ] Profile updates work and refresh automatically
- [ ] Loading states are handled properly
- [ ] Error handling works correctly
- [ ] Sign out clears all state

## Common Issues and Solutions

### Issue 1: Permissions Not Working

**Problem:** User has role but permissions don't work
**Solution:** Check JWT token includes custom claims

```typescript
// Debug JWT claims
const { claims } = useAuth()
console.log('JWT Claims:', claims)
```

### Issue 2: Profile Not Loading

**Problem:** Profile is null even when authenticated
**Solution:** Check profile table exists and has correct foreign key

```sql
-- Check profile exists
SELECT * FROM profiles WHERE id = 'user-uuid';
```

### Issue 3: Role Selection Not Working

**Problem:** OAuth users stuck in pending state
**Solution:** Implement role selection modal

```typescript
const { needsRoleSelection } = useAuth()

if (needsRoleSelection()) {
  return <RoleSelectionModal />
}
```

### Issue 4: Stale Permissions

**Problem:** Permissions don't update after role change
**Solution:** User must log out and back in for JWT refresh

```typescript
// Force refresh after role change
const { signOut } = useAuth()
await signOut()
// Redirect to login
```

## Performance Considerations

### 1. Minimize Re-renders

```typescript
// Good - specific permission check
const { canAdminUsers } = usePermissions()

// Avoid - causes re-render on any permission change
const { permissions } = usePermissions()
const canAdmin = permissions.includes('admin_users')
```

### 2. Use Convenience Getters

```typescript
// Good - pre-computed
const { isAdmin, isMentor } = usePermissions()

// Avoid - computed on every render
const { hasRole } = usePermissions()
const isAdmin = hasRole('admin')
```

### 3. Memoize Complex Checks

```typescript
import { useMemo } from 'react'

const complexPermissionCheck = useMemo(() => {
  return hasAllPermissions(['admin_users', 'admin_system']) && isActive
}, [hasAllPermissions, isActive])
```

## Support

If you encounter issues during migration:

1. Check the console for authentication errors
2. Verify JWT tokens include custom claims
3. Test with the validation scripts in `/scripts/`
4. Review the RBAC system documentation

The new consolidated system provides a much more robust and maintainable authentication foundation for the Menvo platform.