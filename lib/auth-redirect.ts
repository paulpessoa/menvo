import { UserRole } from "@/types/database"

/**
 * Determines the appropriate redirect URL based on user role and status
 */
export function determineRedirect(
  userRole: UserRole | null,
  verificationStatus?: string,
  hasCompletedProfile?: boolean
): string {
  // If user hasn't selected a role yet, send to role selection
  if (!userRole || userRole === "pending") {
    return "/auth/select-role"
  }

  // If user profile is incomplete, send to profile completion
  if (!hasCompletedProfile) {
    return "/profile"
  }

  // If user is not verified yet, send to appropriate waiting page
  if (verificationStatus === "pending") {
    switch (userRole) {
      case "mentor":
        return "/confirmation?type=mentor-verification"
      case "mentee":
        return "/dashboard" // Mentees don't need verification
      case "volunteer":
        return "/confirmation?type=volunteer-verification"
      default:
        return "/dashboard"
    }
  }

  // If user is rejected, send to rejection page
  if (verificationStatus === "rejected") {
    return "/auth/rejected"
  }

  // User is verified, redirect based on role
  switch (userRole) {
    case "admin":
      return "/admin"
    case "mentor":
      return "/dashboard/mentor"
    case "mentee":
      return "/dashboard/mentee"
    case "volunteer":
      return "/voluntariometro"
    case "moderator":
      return "/admin/moderator"
    default:
      return "/dashboard"
  }
}

/**
 * Checks if user profile is complete enough for their role
 */
export function isProfileComplete(profile: any, userRole: UserRole): boolean {
  if (!profile) return false

  // Basic required fields for all users
  const hasBasicInfo = profile.full_name && profile.email

  if (!hasBasicInfo) return false

  // Role-specific requirements
  switch (userRole) {
    case "mentor":
      return !!(
        profile.bio &&
        profile.current_position &&
        profile.mentor_skills &&
        profile.mentor_skills.length > 0
      )
    
    case "mentee":
      // Mentees have minimal requirements
      return true
    
    case "volunteer":
      // Volunteers need basic info
      return true
    
    case "admin":
    case "moderator":
      return true
    
    default:
      return true
  }
}

/**
 * Gets the dashboard URL for a specific user role
 */
export function getDashboardUrl(userRole: UserRole): string {
  switch (userRole) {
    case "admin":
      return "/admin"
    case "mentor":
      return "/dashboard/mentor"
    case "mentee":
      return "/dashboard/mentee"
    case "volunteer":
      return "/voluntariometro"
    case "moderator":
      return "/admin/moderator"
    default:
      return "/dashboard"
  }
}

/**
 * Checks if a user should be redirected away from role selection
 */
export function shouldSkipRoleSelection(
  userRole: UserRole | null,
  verificationStatus?: string
): boolean {
  // If user already has a role (not pending), they shouldn't be on role selection
  return !!(userRole && userRole !== "pending")
}

/**
 * Gets the appropriate redirect after successful login
 */
export function getPostLoginRedirect(
  userRole: UserRole | null,
  verificationStatus?: string,
  profile?: any,
  intendedDestination?: string
): string {
  // If user was trying to access a specific page, redirect there (if authorized)
  if (intendedDestination && intendedDestination !== "/auth/login") {
    // Check if user is authorized for the intended destination
    if (isAuthorizedForPath(intendedDestination, userRole, verificationStatus)) {
      return intendedDestination
    }
  }

  // Otherwise, use standard role-based redirect
  const hasCompletedProfile = isProfileComplete(profile, userRole || "mentee")
  return determineRedirect(userRole, verificationStatus, hasCompletedProfile)
}

/**
 * Checks if user is authorized to access a specific path
 */
export function isAuthorizedForPath(
  path: string,
  userRole: UserRole | null,
  verificationStatus?: string
): boolean {
  // Public paths
  const publicPaths = ["/", "/about", "/how-it-works", "/mentors"]
  if (publicPaths.some(p => path.startsWith(p))) {
    return true
  }

  // Auth paths (only for non-authenticated users)
  if (path.startsWith("/auth/")) {
    return false // Authenticated users shouldn't access auth pages
  }

  // Admin paths
  if (path.startsWith("/admin")) {
    return userRole === "admin" || userRole === "moderator"
  }

  // Volunteer paths
  if (path.startsWith("/checkin") || path === "/voluntariometro") {
    return userRole === "volunteer" || userRole === "admin" || userRole === "mentor"
  }

  // Mentor-specific paths
  if (path.startsWith("/dashboard/mentor") || path.startsWith("/mentor/")) {
    return userRole === "mentor" && verificationStatus === "verified"
  }

  // Mentee-specific paths
  if (path.startsWith("/dashboard/mentee") || path.startsWith("/mentee/")) {
    return userRole === "mentee"
  }

  // General dashboard (most users can access)
  if (path.startsWith("/dashboard")) {
    return !!(userRole && userRole !== "pending")
  }

  // Profile and settings (all authenticated users)
  if (path.startsWith("/profile") || path.startsWith("/settings")) {
    return !!(userRole && userRole !== "pending")
  }

  // Default: allow access for authenticated users
  return !!(userRole && userRole !== "pending")
}