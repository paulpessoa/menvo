/**
 * Simplified Authentication Module
 * 
 * This module provides essential authentication utilities for the Menvo platform.
 * Simplified for MVP with only core functionality.
 * 
 * @module lib/auth
 */

// Core Authentication Components
export { AuthProvider, useAuth } from './auth-context'

// Route Protection Components (if they exist)
export { 
  AuthGuard,
  RequireAuth,
  RequireRole,
  RequireVerifiedMentor,
  RequireAdmin
} from './auth-guard'

// Server-side Utilities (if they exist)
export { getUserFromRequest } from './server-utils'

// TypeScript Type Definitions
export type { AuthContextType, Profile, UserRoleType, Permission } from './auth-context'
