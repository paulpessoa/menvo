# Design Document

## Overview

Após análise detalhada do código atual, identifiquei múltiplas implementações conflitantes de autenticação que estão causando complexidade desnecessária. O design proposto consolida tudo em uma arquitetura simples e unificada, eliminando redundâncias e mantendo apenas o essencial para um MVP funcional.

## Problemas Identificados no Sistema Atual

### 1. Múltiplos Hooks de Autenticação Conflitantes
- `hooks/useAuth.ts` - Hook básico com signIn/signOut
- `lib/auth/use-auth.ts` - Hook com helpers adicionais
- `lib/auth/auth-context.tsx` - Context com useAuth próprio
- `hooks/usePermissions.ts` - Sistema de permissões separado
- `hooks/useRoleManagement.ts` - Sistema complexo de role management
- `hooks/useRoleSelection.ts` - Outro sistema de seleção de role

### 2. Serviços Duplicados
- `services/auth/roleService.ts` - Serviço baseado em JWT
- `services/auth/userService.ts` - Serviço baseado em banco
- Múltiplas APIs: `/api/auth/select-role`, `/api/auth/update-role`

### 3. Lógicas de Redirecionamento Complexas
- `lib/auth-redirect.ts` - Sistema complexo de redirecionamento
- Múltiplas verificações de status e perfil
- Lógicas conflitantes entre diferentes componentes

## Architecture

### Arquitetura Simplificada Proposta

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Auth Layer                      │
├─────────────────────────────────────────────────────────────┤
│  AuthProvider (Context)                                     │
│  ├── useAuth (Single Hook)                                  │
│  ├── Simple Role Management                                 │
│  └── Basic Permissions                                      │
├─────────────────────────────────────────────────────────────┤
│                    API Layer                                │
│  ├── /api/auth/me (Get current user)                       │
│  ├── /api/auth/select-role (Set user role)                 │
│  └── /api/auth/logout (Clear session)                      │
├─────────────────────────────────────────────────────────────┤
│                   Database Layer                            │
│  ├── profiles (Main user table)                            │
│  ├── roles (mentor, mentee, admin)                         │
│  └── user_roles (User-role relationship)                   │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Unified Auth Context

**File:** `lib/auth/auth-context.tsx` (Consolidado)

```typescript
interface AuthContextType {
  // State
  user: User | null
  profile: Profile | null
  role: 'mentor' | 'mentee' | 'admin' | null
  loading: boolean
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  selectRole: (role: 'mentor' | 'mentee') => Promise<void>
  
  // Helpers
  hasRole: (role: string) => boolean
  canAccess: (permission: string) => boolean
}
```

### 2. Simplified Permissions

**Permissions Matrix:**
```
Role    | View Mentors | Book Sessions | Provide Mentorship | Admin Access
--------|--------------|---------------|-------------------|-------------
mentee  | ✓            | ✓             | ✗                 | ✗
mentor  | ✓            | ✓             | ✓                 | ✗
admin   | ✓            | ✓             | ✓                 | ✓
```

### 3. Streamlined API Endpoints

**Keep Only:**
- `GET /api/auth/me` - Get current user state
- `POST /api/auth/select-role` - Set user role
- `POST /api/auth/logout` - Clear session

**Remove:**
- `/api/auth/update-role` (duplicate)
- `/api/auth/custom-claims` (overcomplicated)
- Multiple OAuth diagnostics endpoints

## Data Models

### Database Schema (Simplified)

```sql
-- Main profiles table (keep as is)
profiles {
  id: UUID (PK)
  email: TEXT
  first_name: TEXT
  last_name: TEXT
  full_name: TEXT (generated)
  avatar_url: TEXT
  bio: TEXT
  verified: BOOLEAN
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
}

-- Simple roles (keep as is)
roles {
  id: SERIAL (PK)
  name: TEXT ('mentor', 'mentee', 'admin')
}

-- User roles relationship (keep as is)
user_roles {
  id: SERIAL (PK)
  user_id: UUID (FK to profiles)
  role_id: INTEGER (FK to roles)
  assigned_at: TIMESTAMPTZ
}
```

### Frontend State Management

```typescript
// Single source of truth for auth state
interface AuthState {
  user: User | null
  profile: Profile | null
  role: 'mentor' | 'mentee' | 'admin' | null
  loading: boolean
  initialized: boolean
}
```

## Error Handling

### Simplified Error Handling Strategy

1. **Authentication Errors:** Clear, user-friendly messages
2. **Role Selection Errors:** Retry mechanism with fallback
3. **Permission Errors:** Redirect to appropriate page
4. **Network Errors:** Show retry option

### Error Recovery Flows

```
Login Error → Show message → Allow retry
Role Selection Error → Show message → Allow retry
Permission Denied → Redirect to dashboard
Session Expired → Clear state → Redirect to login
```

## Testing Strategy

### Unit Tests
- Auth context state management
- Permission checking logic
- Role selection flow
- Error handling scenarios

### Integration Tests
- Complete login flow
- Role selection and persistence
- Permission-based page access
- Logout and session cleanup

### E2E Tests
- User registration → role selection → dashboard access
- Login → different role dashboards
- Permission-based feature access
- Logout flow

## Migration Strategy

### Phase 1: Cleanup (Remove Redundant Code)
1. Remove duplicate hooks: `useRoleManagement`, `useRoleSelection`, `usePermissions`
2. Remove duplicate services: `roleService` JWT-based logic
3. Remove unused API endpoints
4. Remove complex redirect logic

### Phase 2: Consolidation (Unify Remaining Code)
1. Consolidate auth hooks into single `useAuth`
2. Simplify auth context to essential functionality
3. Streamline API endpoints
4. Simplify permission checking

### Phase 3: Testing & Validation
1. Test all auth flows thoroughly
2. Validate permission system
3. Test error scenarios
4. Performance testing

## Security Considerations

### Authentication Security
- JWT tokens managed by Supabase
- Secure session handling
- Proper logout cleanup

### Authorization Security
- RLS policies in database
- Frontend permission checks
- API endpoint protection

### Data Protection
- Minimal data exposure
- Secure profile updates
- Protected admin functions

## Performance Optimizations

### Frontend Optimizations
- Minimize auth state updates
- Cache user permissions
- Lazy load role-specific components

### Backend Optimizations
- Efficient database queries
- Minimal API calls
- Proper indexing on user_roles table

## Deployment Considerations

### Environment Variables
- Supabase URL and keys
- JWT secret configuration
- OAuth provider settings (if needed)

### Database Migrations
- No schema changes needed
- Only cleanup of unused tables/functions
- Verify RLS policies are working

### Monitoring
- Auth success/failure rates
- Role selection completion rates
- Permission denial tracking
- Error rate monitoring