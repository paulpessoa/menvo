export const publicRoutes = [
  "/",
  "/about",
  "/how-it-works",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/unauthorized",
  "/confirmation",
  "/auth/callback",
  "/auth/confirmed",
  "/auth/error",
  "/auth/resend-confirmation",
  "/test-callback", // Para debug
  "/mentors"
];

export const protectedRoutes = [
  "/dashboard",
  "/profile",
  "/mentors/[id]/schedule",
  "/messages",
  "/calendar",
  "/admin",
  "/mentorship",
  "/volunteer-activities",
  "/onboarding",
];

export const adminRoutes = ["/admin"];

export const onboardingRequiredRoutes = ["/dashboard", "/mentors/[id]/schedule", "/messages", "/calendar"];

export const authRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"];
