# RBAC System Management Guide

This guide explains how to manage the Role-Based Access Control (RBAC) system in the Menvo authentication platform.

## Overview

The RBAC system provides granular permission control through:
- **Roles**: User categories (mentor, mentee, admin, etc.)
- **Permissions**: Specific actions users can perform
- **Role-Permission Mappings**: Which permissions each role has
- **User-Role Assignments**: Which roles each user has

## System Roles

### Public Registration Roles
- **`mentee`** - Users seeking mentorship
- **`mentor`** - Users providing mentorship (requires validation)

### Admin-Assigned Roles  
- **`admin`** - System administrators with full access
- **`volunteer`** - Platform volunteers
- **`moderator`** - Content and verification moderators

### System Roles
- **`pending`** - OAuth users who haven't selected a role

## Permissions Structure

### Profile Permissions
- `view_mentors` - View mentor profiles
- `view_profiles` - View user profiles  
- `update_own_profile` - Update own profile

### Mentorship Permissions
- `book_sessions` - Book mentorship sessions
- `provide_mentorship` - Provide mentorship services
- `manage_availability` - Manage mentor availability

### Administrative Permissions
- `admin_users` - Administer user accounts
- `admin_verifications` - Handle profile verifications
- `admin_system` - Full system administration
- `manage_roles` - Manage user roles and permissions

### Specialized Permissions
- `validate_activities` - Validate volunteer activities
- `moderate_content` - Moderate platform content
- `moderate_verifications` - Moderate verification requests

## Role-Permission Matrix

| Role | Permissions |
|------|-------------|
| **mentee** | view_mentors, view_profiles, update_own_profile, book_sessions |
| **mentor** | view_mentors, view_profiles, update_own_profile, provide_mentorship, manage_availability |
| **admin** | ALL PERMISSIONS |
| **volunteer** | view_mentors, view_profiles, validate_activities |
| **moderator** | view_mentors, view_profiles, moderate_content, moderate_verifications, admin_verifications |
| **pending** | NO PERMISSIONS |

## Management Functions

### Assign Role to User

```sql
-- Assign a role to a user
SELECT public.assign_user_role(
    'user-uuid-here'::UUID,     -- target user ID
    'mentor',                   -- role name
    'admin-uuid-here'::UUID,    -- assigned by (optional)
    NULL                        -- expires at (optional)
);
```

### Remove Role from User

```sql
-- Remove a role from a user
SELECT public.remove_user_role(
    'user-uuid-here'::UUID,     -- target user ID
    'mentor'                    -- role name
);
```

### Get User's Roles

```sql
-- Get all roles for a user
SELECT * FROM public.get_user_roles('user-uuid-here'::UUID);
```

### Get User's Permissions

```sql
-- Get all permissions for a user
SELECT public.get_user_permissions('user-uuid-here'::UUID);
```

### Check Specific Permission

```sql
-- Check if user has specific permission
SELECT public.user_has_permission('user-uuid-here'::UUID, 'admin_users');
```

## Common Management Tasks

### 1. Make User an Admin

```sql
-- Assign admin role
SELECT public.assign_user_role(
    (SELECT id FROM profiles WHERE email = 'user@example.com'),
    'admin',
    (SELECT id FROM profiles WHERE email = 'current-admin@example.com')
);

-- Verify assignment
SELECT * FROM public.get_user_roles(
    (SELECT id FROM profiles WHERE email = 'user@example.com')
);
```

### 2. Promote Mentee to Mentor

```sql
-- Remove mentee role
SELECT public.remove_user_role(
    (SELECT id FROM profiles WHERE email = 'user@example.com'),
    'mentee'
);

-- Assign mentor role
SELECT public.assign_user_role(
    (SELECT id FROM profiles WHERE email = 'user@example.com'),
    'mentor'
);

-- Update verification status for mentor
UPDATE profiles 
SET verification_status = 'pending_validation', updated_at = NOW()
WHERE email = 'user@example.com';
```

### 3. Create Volunteer

```sql
-- Assign volunteer role
SELECT public.assign_user_role(
    (SELECT id FROM profiles WHERE email = 'volunteer@example.com'),
    'volunteer',
    (SELECT id FROM profiles WHERE email = 'admin@example.com')
);
```

### 4. Suspend User Access

```sql
-- Update user status to suspended
UPDATE profiles 
SET status = 'suspended', updated_at = NOW()
WHERE email = 'user@example.com';

-- Note: User keeps roles but status affects JWT claims
```

### 5. Bulk Role Assignment

```sql
-- Assign moderator role to multiple users
DO $
DECLARE
    user_email TEXT;
    user_emails TEXT[] := ARRAY['mod1@example.com', 'mod2@example.com', 'mod3@example.com'];
BEGIN
    FOREACH user_email IN ARRAY user_emails LOOP
        PERFORM public.assign_user_role(
            (SELECT id FROM profiles WHERE email = user_email),
            'moderator'
        );
        RAISE NOTICE 'Assigned moderator role to %', user_email;
    END LOOP;
END $;
```

## Validation and Monitoring

### System Health Check

```sql
-- Run comprehensive RBAC validation
\i validate_rbac_system.sql
```

### View System Summary

```sql
-- Get RBAC system overview
SELECT * FROM public.rbac_system_summary;
```

### Monitor Role Assignments

```sql
-- Recent role assignments
SELECT 
    p.email,
    r.name as role,
    ur.assigned_at,
    assigned_by.email as assigned_by
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.id
JOIN roles r ON ur.role_id = r.id
LEFT JOIN profiles assigned_by ON ur.assigned_by = assigned_by.id
WHERE ur.assigned_at > NOW() - INTERVAL '7 days'
ORDER BY ur.assigned_at DESC;
```

### Find Users by Permission

```sql
-- Find all users with specific permission
SELECT DISTINCT
    p.email,
    p.role,
    perm.name as permission
FROM profiles p
JOIN user_roles ur ON p.id = ur.user_id
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions perm ON rp.permission_id = perm.id
WHERE perm.name = 'admin_users'
ORDER BY p.email;
```

### Audit User Permissions

```sql
-- Complete permission audit for a user
SELECT 
    p.email,
    p.role as profile_role,
    p.status,
    r.name as assigned_role,
    perm.name as permission,
    perm.resource,
    perm.action
FROM profiles p
JOIN user_roles ur ON p.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions perm ON rp.permission_id = perm.id
WHERE p.email = 'user@example.com'
ORDER BY perm.resource, perm.action;
```

## Adding New Permissions

### 1. Create New Permission

```sql
-- Add new permission
INSERT INTO permissions (name, description, resource, action)
VALUES (
    'export_data',
    'Export platform data',
    'data',
    'export'
);
```

### 2. Assign to Roles

```sql
-- Assign new permission to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id,
    p.id
FROM roles r, permissions p
WHERE r.name = 'admin' AND p.name = 'export_data';
```

### 3. Verify Assignment

```sql
-- Check permission was assigned
SELECT 
    r.name as role,
    p.name as permission
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.name = 'export_data';
```

## Creating New Roles

### 1. Add Role

```sql
-- Create new role
INSERT INTO roles (name, description, is_system_role)
VALUES (
    'supervisor',
    'Team supervisor with limited admin access',
    false
);
```

### 2. Assign Permissions

```sql
-- Assign permissions to new role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id,
    p.id
FROM roles r, permissions p
WHERE r.name = 'supervisor' 
AND p.name IN ('view_mentors', 'view_profiles', 'moderate_content');
```

### 3. Update Enum (if needed for profile.role)

```sql
-- Add to user_role enum if this role should be a primary role
ALTER TYPE user_role ADD VALUE 'supervisor';
```

## Security Best Practices

### 1. Principle of Least Privilege
- Only assign minimum permissions needed
- Regularly audit user permissions
- Remove unused roles and permissions

### 2. Role Assignment Tracking
- Always specify `assigned_by` when assigning roles
- Use expiration dates for temporary access
- Log role changes for audit trail

### 3. Permission Validation
- Always validate permissions on backend
- Don't rely solely on frontend permission checks
- Use RLS policies for database-level security

### 4. Regular Audits

```sql
-- Monthly permission audit
SELECT 
    'Users with admin access' as audit_item,
    COUNT(*) as count
FROM profiles p
WHERE public.user_has_permission(p.id, 'admin_system')
UNION ALL
SELECT 
    'Users with multiple roles',
    COUNT(DISTINCT user_id)
FROM user_roles
GROUP BY user_id
HAVING COUNT(*) > 1;
```

## Troubleshooting

### User Can't Access Feature

1. **Check User Role**:
   ```sql
   SELECT role, status FROM profiles WHERE email = 'user@example.com';
   ```

2. **Check Role Assignments**:
   ```sql
   SELECT * FROM public.get_user_roles(
       (SELECT id FROM profiles WHERE email = 'user@example.com')
   );
   ```

3. **Check Permissions**:
   ```sql
   SELECT public.get_user_permissions(
       (SELECT id FROM profiles WHERE email = 'user@example.com')
   );
   ```

### Permission Not Working

1. **Verify Permission Exists**:
   ```sql
   SELECT * FROM permissions WHERE name = 'permission_name';
   ```

2. **Check Role Mapping**:
   ```sql
   SELECT r.name, p.name
   FROM roles r
   JOIN role_permissions rp ON r.id = rp.role_id
   JOIN permissions p ON rp.permission_id = p.id
   WHERE p.name = 'permission_name';
   ```

3. **Check JWT Claims**:
   - User must log out and back in after role changes
   - JWT tokens cache permissions until refresh

### RLS Policy Issues

1. **Check RLS Status**:
   ```sql
   SELECT schemaname, tablename, rowsecurity
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('roles', 'permissions', 'user_roles');
   ```

2. **List Policies**:
   ```sql
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   ```

## Integration with Frontend

### React Hook Example

```typescript
import { useUserClaims } from './useUserClaims'

export function usePermissions() {
  const claims = useUserClaims()
  
  const hasPermission = (permission: string): boolean => {
    return claims?.permissions?.includes(permission) || false
  }
  
  const hasRole = (role: string): boolean => {
    return claims?.role === role
  }
  
  const isAdmin = hasRole('admin')
  const canManageUsers = hasPermission('admin_users')
  const canModerate = hasPermission('moderate_content')
  
  return {
    hasPermission,
    hasRole,
    isAdmin,
    canManageUsers,
    canModerate,
    permissions: claims?.permissions || [],
    role: claims?.role || 'pending'
  }
}
```

### Component Protection

```typescript
import { usePermissions } from './usePermissions'

export function AdminPanel() {
  const { hasPermission } = usePermissions()
  
  if (!hasPermission('admin_system')) {
    return <div>Access denied</div>
  }
  
  return <div>Admin content here</div>
}
```

## Maintenance

### Regular Tasks

1. **Weekly**: Review new user registrations and role assignments
2. **Monthly**: Audit admin and moderator permissions
3. **Quarterly**: Review and clean up unused permissions
4. **Annually**: Complete security audit of RBAC system

### Performance Monitoring

```sql
-- Monitor RBAC function performance
SELECT 
    funcname,
    calls,
    total_time,
    mean_time
FROM pg_stat_user_functions 
WHERE funcname IN ('get_user_permissions', 'user_has_permission')
ORDER BY total_time DESC;
```

This RBAC system provides a flexible, secure foundation for managing user permissions in the Menvo platform while maintaining simplicity for common operations.