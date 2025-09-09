# Authentication Module

This module provides comprehensive authentication utilities for the Menvo platform, including React context, route guards, OAuth configuration, and server-side utilities.

## Overview

The authentication system is built around Supabase Auth and provides:
- React authentication context and hooks
- Route protection components
- OAuth provider configuration and validation
- Server-side authentication utilities
- Middleware for OAuth validation

## Core Components

### Authentication Context (`auth-context.tsx`)
Provides global authentication state management using React Context.

**Key Features:**
- User session management
- Profile data loading
- Authentication state persistence
- Sign out functionality

**Usage:**
\`\`\`typescript
import { AuthProvider, useAuth } from '@/lib/auth'

// Wrap your app with AuthProvider
<AuthProvider>
  <App />
</AuthProvider>

// Use authentication in components
const { user, profile, loading, signOut } = useAuth()
\`\`\`

### Authentication Hook (`use-auth.ts`)
Custom hook that provides access to authentication context.

**Returns:**
- `user`: Current authenticated user
- `profile`: User profile data
- `loading`: Authentication loading state
- `signOut`: Function to sign out user

### Route Guards (`auth-guard.tsx`)
Components for protecting routes based on authentication and roles.

**Available Guards:**
- `AuthGuard`: Requires authentication
- `RequireAuth`: Redirects to login if not authenticated
- `RequireRole`: Requires specific user role
- `RequireVerifiedMentor`: Requires verified mentor status
- `RequireAdmin`: Requires admin role

**Usage:**
\`\`\`typescript
import { RequireRole, RequireAuth } from '@/lib/auth'

// Protect entire page
<RequireAuth>
  <Dashboard />
</RequireAuth>

// Require specific role
<RequireRole role="mentor">
  <MentorDashboard />
</RequireRole>
\`\`\`

## OAuth Configuration

### OAuth Config Validator (`oauth-config-validator.ts`)
Validates OAuth provider configurations and provides detailed error reporting.

**Key Functions:**
- `validateGoogleOAuth()`: Validates Google OAuth setup
- `validateLinkedInOAuth()`: Validates LinkedIn OAuth setup
- `validateGitHubOAuth()`: Validates GitHub OAuth setup
- `validateAllOAuthProviders()`: Validates all providers
- `isOAuthReadyForProduction()`: Checks production readiness
- `generateOAuthReport()`: Creates detailed configuration report

**Usage:**
\`\`\`typescript
import { validateAllOAuthProviders, generateOAuthReport } from '@/lib/auth'

// Validate all providers
const validations = validateAllOAuthProviders()

// Generate detailed report
const report = generateOAuthReport()
\`\`\`

### OAuth Middleware (`oauth-middleware.ts`)
Provides middleware functions for OAuth validation in Next.js applications.

**Key Functions:**
- `oauthValidationMiddleware()`: Validates OAuth on auth routes
- `checkOAuthProviderAvailability()`: Checks if provider is available
- `createOAuthErrorResponse()`: Creates standardized error responses
- `handleOAuthHealthCheck()`: Health check endpoint handler

### OAuth Provider Fixes (`oauth-provider-fixes.ts`)
Enhanced OAuth implementations with proper error handling and provider-specific fixes.

**Key Functions:**
- `signInWithOAuthProvider()`: Enhanced OAuth sign-in with error handling
- `getOAuthConfig()`: Gets provider-specific configuration
- `validateOAuthProvider()`: Validates individual provider setup
- `testOAuthProvider()`: Tests provider availability

**Usage:**
\`\`\`typescript
import { signInWithOAuthProvider } from '@/lib/auth'

// Sign in with enhanced error handling
const result = await signInWithOAuthProvider(supabase, 'google', {
  redirectTo: '/dashboard'
})
\`\`\`

## Server Utilities

### Server Utils (`server-utils.ts`)
Server-side authentication utilities for API routes and middleware.

**Key Functions:**
- `getUserFromRequest()`: Extracts authenticated user from request

**Usage:**
\`\`\`typescript
import { getUserFromRequest } from '@/lib/auth'

// In API route
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }
  // ... handle authenticated request
}
\`\`\`

## Types

### Core Types
\`\`\`typescript
interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  role: string | null
  // ... other profile fields
}
\`\`\`

### OAuth Types
\`\`\`typescript
interface OAuthConfig {
  provider: 'google' | 'linkedin' | 'github'
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes?: string[]
  enabled: boolean
}

interface ConfigValidation {
  isValid: boolean
  provider: string
  errors: string[]
  warnings: string[]
  config?: Partial<OAuthConfig>
}
\`\`\`

## Environment Variables

### Required Variables
\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.com
\`\`\`

## Development

### Testing OAuth Configuration
Use the validation utilities to check your OAuth setup:

\`\`\`bash
# Run OAuth validation script
node scripts/validation/validate-oauth-config.js status

# Generate detailed report
node scripts/validation/validate-oauth-config.js report

# Test OAuth providers
node scripts/test-oauth-fixes.js
\`\`\`

### Common Issues

1. **OAuth Provider Not Working**
   - Check environment variables are set correctly
   - Verify redirect URIs match in provider dashboard
   - Use `validateAllOAuthProviders()` to diagnose issues

2. **Authentication State Not Persisting**
   - Ensure `AuthProvider` wraps your entire app
   - Check Supabase configuration
   - Verify session storage is working

3. **Route Guards Not Working**
   - Make sure component is wrapped with appropriate guard
   - Check user roles are set correctly in database
   - Verify authentication context is available

## Security Considerations

- Never expose service role keys in client-side code
- Always validate user permissions on server-side
- Use appropriate route guards for sensitive pages
- Regularly rotate OAuth client secrets
- Monitor authentication logs for suspicious activity

## Migration Notes

This module was cleaned up to remove unused code:
- Removed `oauth-startup-validator.ts` (functions were exported but never used)
- Updated exports in `index.ts` to reflect actual usage
- All existing functionality remains intact
