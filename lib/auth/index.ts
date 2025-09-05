/**
 * Authentication Module
 * 
 * This module provides comprehensive authentication utilities for the Menvo platform.
 * It includes React context, route guards, OAuth configuration, and server-side utilities.
 * 
 * @module lib/auth
 */

// Core Authentication Components
export { AuthProvider } from './auth-context'  // React context provider for authentication state
export { useAuth } from './use-auth'            // Hook to access authentication context

// Route Protection Components
export { 
  AuthGuard,              // Basic authentication guard
  RequireAuth,            // Redirects to login if not authenticated
  RequireRole,            // Requires specific user role
  RequireVerifiedMentor,  // Requires verified mentor status
  RequireAdmin            // Requires admin role
} from './auth-guard'

// Server-side Utilities
export { getUserFromRequest } from './server-utils'  // Extract user from API request

// OAuth Configuration and Validation
export {
  validateGoogleOAuth,        // Validate Google OAuth configuration
  validateLinkedInOAuth,      // Validate LinkedIn OAuth configuration
  validateGitHubOAuth,        // Validate GitHub OAuth configuration
  validateAllOAuthProviders,  // Validate all OAuth providers
  getOAuthEnvironment,        // Get OAuth environment information
  isOAuthReadyForProduction,  // Check if OAuth is ready for production
  generateOAuthReport,        // Generate detailed OAuth configuration report
  logOAuthStatus              // Log OAuth configuration status to console
} from './oauth-config-validator'

// OAuth Middleware and Utilities
export {
  oauthValidationMiddleware,      // Middleware for OAuth validation
  checkOAuthProviderAvailability, // Check if OAuth provider is available
  createOAuthErrorResponse,       // Create standardized OAuth error responses
  handleOAuthHealthCheck          // Handle OAuth health check requests
} from './oauth-middleware'

// TypeScript Type Definitions
export type { AuthContextType, Profile } from './auth-context'
export type { 
  OAuthConfig,        // OAuth provider configuration interface
  ConfigValidation,   // OAuth validation result interface
  OAuthEnvironment    // OAuth environment information interface
} from './oauth-config-validator'