"use client"

import { useAuth } from "@/app/context/auth-context"

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
  const { role, permissions, loading } = useAuth()

  const hasPermission = (permission: Permission): boolean => {
    if (loading) return false
    return permissions?.includes(permission) || false
  }

  const hasRole = (roleToCheck: UserRoleType): boolean => {
    if (loading) return false
    return role === roleToCheck
  }

  const hasAnyPermission = (perms: Permission[]): boolean => {
    if (loading) return false
    return perms.some((p) => permissions?.includes(p))
  }

  return {
    role,
    permissions,
    loading,
    hasPermission,
    hasRole,
    hasAnyPermission,
    isAdmin: hasRole("admin"),
    isMentor: hasRole("mentor"),
    isMentee: hasRole("mentee"),
  }
}
