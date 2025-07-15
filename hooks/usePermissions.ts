"use client"

import { useAuth } from "@/app/context/auth-context"
import { getUserPermissions, type Permission } from "@/lib/auth/rbac"

export function usePermissions() {
  const { profile, loading } = useAuth()
  const role = profile?.role || "pending"
  const permissions = getUserPermissions(role)

  const has = (p: Permission) => permissions.includes(p)

  return {
    loading,
    role,
    permissions,
    hasPermission: has,
    isAdmin: role === "admin",
    isModerator: role === "moderator",
    isMentor: role === "mentor",
    isMentee: role === "mentee",
    isVolunteer: role === "volunteer",
    canAdminSystem: has("system:update-settings"),
    canAdminUsers: has("users:manage-roles"),
    canAdminVerifications: has("verifications:approve"),
    canValidateActivities: has("volunteer-activities:validate"),
    canViewReports: has("reports:view"),
  }
}
