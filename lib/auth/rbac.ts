export type UserRole = "admin" | "moderator" | "mentor" | "mentee" | "volunteer" | "pending"

export type Permission =
  // User management
  | "users:list"
  | "users:read"
  | "users:update"
  | "users:delete"
  | "users:manage-roles"
  // Verification management
  | "verifications:list"
  | "verifications:read"
  | "verifications:approve"
  | "verifications:reject"
  // Volunteer activities
  | "volunteer-activities:list"
  | "volunteer-activities:validate"
  // System settings
  | "system:read-settings"
  | "system:update-settings"
  // Reports
  | "reports:view"

const ROLES_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "users:list",
    "users:read",
    "users:update",
    "users:delete",
    "users:manage-roles",
    "verifications:list",
    "verifications:read",
    "verifications:approve",
    "verifications:reject",
    "volunteer-activities:list",
    "volunteer-activities:validate",
    "system:read-settings",
    "system:update-settings",
    "reports:view",
  ],
  moderator: [
    "users:list",
    "users:read",
    "verifications:list",
    "verifications:read",
    "verifications:approve",
    "verifications:reject",
    "volunteer-activities:list",
    "volunteer-activities:validate",
  ],
  mentor: [],
  mentee: [],
  volunteer: [],
  pending: [],
}

export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  return ROLES_PERMISSIONS[role]?.includes(permission) || false
}

export const getUserPermissions = (role: UserRole): Permission[] => {
  return ROLES_PERMISSIONS[role] || []
}
