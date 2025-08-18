"use client"

import { useAuth } from "./useAuth"

// Permission types based on the RBAC system
export type Permission =
  | "view_mentors"
  | "view_profiles"
  | "update_own_profile"
  | "book_sessions"
  | "provide_mentorship"
  | "manage_availability"
  | "admin_users"
  | "admin_verifications"
  | "admin_system"
  | "manage_roles"
  | "validate_activities"
  | "moderate_content"
  | "moderate_verifications"

export type UserRole =
  | "pending"
  | "mentee"
  | "mentor"
  | "admin"
  | "volunteer"
  | "moderator"

export interface UsePermissionsReturn {
  // Current user state
  role: string | null
  status: string | null
  permissions: string[]
  loading: boolean

  // Permission checking methods
  hasPermission: (permission: Permission) => boolean
  hasRole: (role: UserRole) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean

  // Convenience role checkers
  isAdmin: boolean
  isMentor: boolean
  isMentee: boolean
  isVolunteer: boolean
  isModerator: boolean
  isPending: boolean

  // Status checkers
  isActive: boolean
  isPendingStatus: boolean
  isSuspended: boolean

  // Verification checkers
  isVerified: boolean
  needsVerification: boolean
  isRejected: boolean

  // Specific permission checkers (commonly used)
  canViewMentors: boolean
  canBookSessions: boolean
  canProvideMentorship: boolean
  canManageAvailability: boolean
  canAdminUsers: boolean
  canAdminSystem: boolean
  canModerateContent: boolean
  canValidateActivities: boolean
}

export function usePermissions(): UsePermissionsReturn {
  const {
    claims,
    profile,
    loading,
    hasRole,
    hasPermission,
    hasAnyPermission,
    isAdmin,
    isMentor,
    isMentee,
    isVolunteer,
    isModerator,
    isPending
  } = useAuth()

  // Enhanced permission checking with fallbacks
  const enhancedHasPermission = (permission: Permission): boolean => {
    if (loading) return false

    // First check JWT claims (most up-to-date)
    if (claims?.permissions?.includes(permission)) return true

    // Fallback to role-based checking if claims not available
    return hasPermission(permission)
  }

  const enhancedHasRole = (role: UserRole): boolean => {
    if (loading) return false

    // Check both JWT claims and profile
    return claims?.role === role || profile?.role === role || hasRole(role)
  }

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (loading) return false
    return permissions.every((p) => enhancedHasPermission(p))
  }

  const enhancedHasAnyPermission = (permissions: Permission[]): boolean => {
    if (loading) return false
    return (
      permissions.some((p) => enhancedHasPermission(p)) ||
      hasAnyPermission(permissions)
    )
  }

  // Status checkers
  const isActive = profile?.status === "active"
  const isPendingStatus = profile?.status === "pending"
  const isSuspended = profile?.status === "suspended"

  // Verification checkers
  const isVerified = profile?.verification_status === "active"
  const needsVerification =
    profile?.verification_status === "pending_validation"
  const isRejected = profile?.verification_status === "rejected"

  // Specific permission checkers (commonly used)
  const canViewMentors = enhancedHasPermission("view_mentors")
  const canBookSessions = enhancedHasPermission("book_sessions")
  const canProvideMentorship = enhancedHasPermission("provide_mentorship")
  const canManageAvailability = enhancedHasPermission("manage_availability")
  const canAdminUsers = enhancedHasPermission("admin_users")
  const canAdminSystem = enhancedHasPermission("admin_system")
  const canModerateContent = enhancedHasPermission("moderate_content")
  const canValidateActivities = enhancedHasPermission("validate_activities")

  return {
    // Current user state
    role: claims?.role || profile?.role || null,
    status: claims?.status || profile?.status || null,
    permissions: claims?.permissions || [],
    loading,

    // Permission checking methods
    hasPermission: enhancedHasPermission,
    hasRole: enhancedHasRole,
    hasAnyPermission: enhancedHasAnyPermission,
    hasAllPermissions,

    // Convenience role checkers
    isAdmin,
    isMentor,
    isMentee,
    isVolunteer,
    isModerator,
    isPending,

    // Status checkers
    isActive,
    isPendingStatus,
    isSuspended,

    // Verification checkers
    isVerified,
    needsVerification,
    isRejected,

    // Specific permission checkers
    canViewMentors,
    canBookSessions,
    canProvideMentorship,
    canManageAvailability,
    canAdminUsers,
    canAdminSystem,
    canModerateContent,
    canValidateActivities
  }
}
