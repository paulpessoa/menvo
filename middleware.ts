import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const protectedRoutes = [
    "/dashboard",
    "/profile",
    "/mentors/[id]/schedule",
    "/messages",
    "/calendar",
    "/admin",
    "/mentorship",
    "/volunteer-activities",
  ]

  const adminRoutes = ["/admin"]

  const onboardingRequiredRoutes = ["/dashboard", "/mentors/[id]/schedule", "/messages", "/calendar"]

  const authRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"]

  const isProtectedRoute = protectedRoutes.some((route) => {
    if (route.includes("[id]")) {
      const routePattern = route.replace("[id]", "[^/]+")
      return new RegExp(`^${routePattern}$`).test(pathname)
    }
    return pathname.startsWith(route)
  })

  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))
  const requiresOnboarding = onboardingRequiredRoutes.some((route) => {
    if (route.includes("[id]")) {
      const routePattern = route.replace("[id]", "[^/]+")
      return new RegExp(`^${routePattern}$`).test(pathname)
    }
    return pathname.startsWith(route)
  })

  if (user && isAuthRoute) {
    const redirectUrl = new URL("/dashboard", request.url)
    return NextResponse.redirect(redirectUrl)
  }

  if (isProtectedRoute && (!user || error)) {
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAdminRoute && user) {
    const userRole = user.user_metadata?.role
    const hasAdminAccess = userRole === "admin" || user.user_metadata?.permissions?.includes("admin_system")

    if (!hasAdminAccess) {
      const redirectUrl = new URL("/unauthorized", request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  if (requiresOnboarding && user) {
    const hasRole = user.user_metadata?.role
    const profileComplete = user.user_metadata?.profile_completed

    if (!hasRole) {
      const redirectUrl = new URL("/onboarding/role-selection", request.url)
      return NextResponse.redirect(redirectUrl)
    }

    if (!profileComplete && hasRole === "mentor") {
      const redirectUrl = new URL("/onboarding/profile", request.url)
      redirectUrl.searchParams.set("role", hasRole)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
