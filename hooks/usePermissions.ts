"use client"

import { useAuth } from "@/lib/auth"

export type UserRoleType = "pending" | "mentee" | "mentor" | "admin" | "volunteer" | "moderator"

export type Permission =
  | "view_mentors"
  | "book_sessions"
  | "provide_mentorship"
  | "manage_availability"
  | "admin_users"
  | "admin_verifications"
  | "admin_system"
  | "validate_activities"
  | "moderate_content"

export function usePermissions() {
  const { role, loading } = useAuth()

  const hasPermission = (permission: Permission): boolean => {
    if (loading) return false
    
    // Simple role-based permissions for MVP
    switch (role) {
      case 'admin':
        return true // Admin has all permissions
      case 'mentor':
        return ['view_mentors', 'provide_mentorship', 'manage_availability'].includes(permission)
      case 'mentee':
        return ['view_mentors', 'book_sessions'].includes(permission)
      default:
        return false
    }
  }

  const hasRole = (roleToCheck: UserRoleType): boolean => {
    if (loading) return false
    return role === roleToCheck
  }

  const hasAnyPermission = (perms: Permission[]): boolean => {
    if (loading) return false
    return perms.some((p) => hasPermission(p))
  }

  // Helper functions for common permission checks
  const isAdmin = hasRole("admin")
  const isMentor = hasRole("mentor")
  const isMentee = hasRole("mentee")
  
  const canAdminSystem = isAdmin
  const canAdminUsers = isAdmin
  const canAdminVerifications = isAdmin
  const canValidateActivities = isAdmin
  const canViewReports = isAdmin

  return {
    role,
    loading,
    hasPermission,
    hasRole,
    hasAnyPermission,
    isAdmin,
    isMentor,
    isMentee,
    canAdminSystem,
    canAdminUsers,
    canAdminVerifications,
    canValidateActivities,
    canViewReports,
  }
}
