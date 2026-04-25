export const publicRoutes = [
  "/",
  "/about",
  "/how-it-works",
  "/login",
  "/signup",
  "/forgot-password",
  "/update-password",
  "/unauthorized",
  "/confirmation",
  "/auth/callback",
  "/auth/confirmed",
  "/auth/error",
  "/auth/resend-confirmation",
  "/test-callback",
  "/mentors"
]

export const protectedRoutes = [
  "/dashboard",
  "/profile",
  "/mentors/[id]/schedule",
  "/messages",
  "/calendar",
  "/dashboard/admin",
  "/mentorship",
  "/volunteer-activities",
  "/onboarding",
  "/settings"
]

export const adminRoutes = ["/dashboard/admin"]

export const onboardingRequiredRoutes = [
  "/dashboard",
  "/mentors/[id]/schedule",
  "/messages",
  "/calendar"
]

export const authRoutes = [
  "/login",
  "/signup",
  "/forgot-password",
  "/update-password"
]
