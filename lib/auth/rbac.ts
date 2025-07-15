export type UserRole = "admin" | "moderator" | "mentor" | "mentee" | "volunteer" | "pending"

export type Permission =
  // Admin permissions
  | "admin:all"
  | "admin:users:manage"
  | "admin:system:manage"

  // Moderator permissions
  | "moderator:users:validate"
  | "moderator:mentors:verify"
  | "moderator:volunteers:validate"

  // Mentor permissions
  | "mentor:profile:manage"
  | "mentor:sessions:manage"
  | "mentor:availability:manage"

  // Mentee permissions
  | "mentee:profile:manage"
  | "mentee:sessions:request"
  | "mentee:mentors:search"

  // Volunteer permissions
  | "volunteer:activities:checkin"
  | "volunteer:profile:manage"

  // General permissions
  | "profile:view"
  | "profile:edit"
  | "notifications:view"

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "admin:all",
    "admin:users:manage",
    "admin:system:manage",
    "moderator:users:validate",
    "moderator:mentors:verify",
    "moderator:volunteers:validate",
    "mentor:profile:manage",
    "mentor:sessions:manage",
    "mentor:availability:manage",
    "mentee:profile:manage",
    "mentee:sessions:request",
    "mentee:mentors:search",
    "volunteer:activities:checkin",
    "volunteer:profile:manage",
    "profile:view",
    "profile:edit",
    "notifications:view",
  ],
  moderator: [
    "moderator:users:validate",
    "moderator:mentors:verify",
    "moderator:volunteers:validate",
    "profile:view",
    "profile:edit",
    "notifications:view",
  ],
  mentor: [
    "mentor:profile:manage",
    "mentor:sessions:manage",
    "mentor:availability:manage",
    "profile:view",
    "profile:edit",
    "notifications:view",
  ],
  mentee: [
    "mentee:profile:manage",
    "mentee:sessions:request",
    "mentee:mentors:search",
    "profile:view",
    "profile:edit",
    "notifications:view",
  ],
  volunteer: [
    "volunteer:activities:checkin",
    "volunteer:profile:manage",
    "profile:view",
    "profile:edit",
    "notifications:view",
  ],
  pending: ["profile:view", "profile:edit"],
}

export function hasPermission(userRole: UserRole | null, permission: Permission): boolean {
  if (!userRole) return false
  if (ROLE_PERMISSIONS[userRole]?.includes("admin:all")) return true
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false
}

export function hasAnyPermission(userRole: UserRole | null, permissions: Permission[]): boolean {
  if (!userRole) return false
  if (ROLE_PERMISSIONS[userRole]?.includes("admin:all")) return true
  return permissions.some((permission) => hasPermission(userRole, permission))
}

export function getUserPermissions(userRole: UserRole): Permission[] {
  return ROLE_PERMISSIONS[userRole] || []
}

export function canValidateUser(validatorRole: UserRole | null, targetRole: UserRole): boolean {
  if (!validatorRole) return false

  if (validatorRole === "admin") return true

  if (validatorRole === "moderator" && targetRole !== "admin") return true

  return false
}

export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    admin: "Administrador",
    moderator: "Moderador",
    mentor: "Mentor",
    mentee: "Mentorado",
    volunteer: "Voluntário",
    pending: "Pendente",
  }
  return roleNames[role] || role
}

export function getRoleColor(role: UserRole): string {
  const roleColors: Record<UserRole, string> = {
    admin: "bg-red-100 text-red-800",
    moderator: "bg-blue-100 text-blue-800",
    mentor: "bg-green-100 text-green-800",
    mentee: "bg-purple-100 text-purple-800",
    volunteer: "bg-orange-100 text-orange-800",
    pending: "bg-gray-100 text-gray-800",
  }
  return roleColors[role] || "bg-gray-100 text-gray-800"
}
