/**
 * Simplified redirect logic for MVP
 * Only handles basic role-based redirects for 3 user types: mentor, mentee, admin
 */

export type SimpleUserRole = "mentor" | "mentee" | "admin" | null

/**
 * Simple redirect based only on user role
 */
export function getSimpleRedirect(role: SimpleUserRole): string {
  // No role = need to select role
  if (!role) {
    return "/auth/select-role"
  }

  // Role-based dashboard redirect
  switch (role) {
    case "admin":
      return "/admin"
    case "mentor":
      return "/dashboard/mentor"
    case "mentee":
      return "/dashboard/mentee"
    default:
      return "/dashboard"
  }
}

/**
 * Get post-login redirect (simplified)
 */
export function getPostLoginRedirect(
  role: SimpleUserRole,
  intendedDestination?: string
): string {
  // If user was trying to access a specific page, redirect there (if authorized)
  if (intendedDestination && intendedDestination !== "/auth/login" && role) {
    if (isAuthorizedForPath(intendedDestination, role)) {
      return intendedDestination
    }
  }

  // Otherwise, use simple role-based redirect
  return getSimpleRedirect(role)
}

/**
 * Checks if user is authorized to access a specific path
 */
export function isAuthorizedForPath(
  path: string,
  role: SimpleUserRole
): boolean {
  // Public paths
  const publicPaths = ["/", "/about", "/how-it-works", "/mentors"]
  if (publicPaths.some((p) => path.startsWith(p))) {
    return true
  }

  // Auth paths (only for non-authenticated users)
  if (path.startsWith("/auth/")) {
    return !role // Only non-authenticated users can access auth pages
  }

  // Admin paths
  if (path.startsWith("/admin")) {
    return role === "admin"
  }

  // Mentor paths
  if (path.startsWith("/dashboard/mentor")) {
    return role === "mentor"
  }

  // Mentee paths
  if (path.startsWith("/dashboard/mentee")) {
    return role === "mentee"
  }

  // General dashboard (all authenticated users)
  if (path.startsWith("/dashboard")) {
    return !!role
  }

  // Profile and settings (all authenticated users)
  if (path.startsWith("/profile") || path.startsWith("/settings")) {
    return !!role
  }

  // Default: allow access for authenticated users
  return !!role
}

// Legacy function names for compatibility
export function determineRedirect(role: SimpleUserRole): string {
  return getSimpleRedirect(role)
}

export function getDashboardUrl(role: SimpleUserRole): string {
  return getSimpleRedirect(role)
}

export function shouldSkipRoleSelection(role: SimpleUserRole): boolean {
  return !!role
}

export function isProfileComplete(): boolean {
  // For MVP, if user has a role, profile is considered complete
  return true
}
