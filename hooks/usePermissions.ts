"use client"

import { useAuth } from "./useAuth"

export type UserRoleType = "admin" | "mentor" | "mentee" | "volunteer" | "moderator"

export function usePermissions() {
  const { permissions, profile } = useAuth()

  const hasPermission = (permission: string): boolean => {
    return permissions?.permissions?.includes(permission) || false
  }

  const hasRole = (role: UserRoleType): boolean => {
    return permissions?.roles?.includes(role) || false
  }

  const hasAnyRole = (roles: UserRoleType[]): boolean => {
    return roles.some((role) => hasRole(role))
  }

  const hasAnyPermission = (perms: string[]): boolean => {
    return perms.some((perm) => hasPermission(perm))
  }

  // Specific permission checks
  const canViewMentors = hasPermission("view_mentors")
  const canBookSessions = hasPermission("book_sessions")
  const canProvideMentorship = hasPermission("provide_mentorship")
  const canManageAvailability = hasPermission("manage_availability")
  const canAdminUsers = hasPermission("admin_users")
  const canAdminVerifications = hasPermission("admin_verifications")
  const canAdminSystem = hasPermission("admin_system")
  const canValidateActivities = hasPermission("validate_activities")
  const canModerateContent = hasPermission("moderate_content")
  const canViewReports = hasPermission("view_reports")
  const canManageRoles = hasPermission("manage_roles")

  // Role checks
  const isAdmin = hasRole("admin")
  const isMentor = hasRole("mentor")
  const isMentee = hasRole("mentee")
  const isVolunteer = hasRole("volunteer")
  const isModerator = hasRole("moderator")

  return {
    permissions: permissions?.permissions || [],
    roles: permissions?.roles || [],
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAnyPermission,

    // Permission checks
    canViewMentors,
    canBookSessions,
    canProvideMentorship,
    canManageAvailability,
    canAdminUsers,
    canAdminVerifications,
    canAdminSystem,
    canValidateActivities,
    canModerateContent,
    canViewReports,
    canManageRoles,

    // Role checks
    isAdmin,
    isMentor,
    isMentee,
    isVolunteer,
    isModerator,
  }
}
