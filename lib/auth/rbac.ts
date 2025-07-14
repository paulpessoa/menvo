export type UserRole = "pending" | "mentee" | "mentor" | "admin" | "volunteer" | "moderator"

export type Permission =
  // Usuários
  | "users:read"
  | "users:write"
  | "users:delete"
  | "users:manage_roles"

  // Verificações
  | "verifications:read"
  | "verifications:approve"
  | "verifications:reject"

  // Mentoria
  | "mentorship:create"
  | "mentorship:join"
  | "mentorship:manage"

  // Voluntários
  | "volunteers:checkin"
  | "volunteers:manage"
  | "volunteers:validate"

  // Admin
  | "admin:dashboard"
  | "admin:analytics"
  | "admin:notifications"
  | "admin:system"

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  pending: [],

  mentee: ["mentorship:join"],

  mentor: ["mentorship:create", "mentorship:manage"],

  volunteer: ["volunteers:checkin"],

  moderator: [
    "users:read",
    "verifications:read",
    "verifications:approve",
    "verifications:reject",
    "volunteers:validate",
    "admin:dashboard",
  ],

  admin: [
    "users:read",
    "users:write",
    "users:delete",
    "users:manage_roles",
    "verifications:read",
    "verifications:approve",
    "verifications:reject",
    "mentorship:create",
    "mentorship:join",
    "mentorship:manage",
    "volunteers:checkin",
    "volunteers:manage",
    "volunteers:validate",
    "admin:dashboard",
    "admin:analytics",
    "admin:notifications",
    "admin:system",
  ],
}

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false
}

export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(userRole, permission))
}

export function getUserPermissions(userRole: UserRole): Permission[] {
  return ROLE_PERMISSIONS[userRole] || []
}
