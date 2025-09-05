import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import {
  protectedRoutes,
  adminRoutes,
  onboardingRequiredRoutes,
  authRoutes,
} from "@/config/routes"
import { 
  determineRedirect, 
  isProfileComplete, 
  shouldSkipRoleSelection,
  isAuthorizedForPath 
} from "@/lib/auth-redirect"

// Consolidated Supabase client creation for middleware
function createClient(request: NextRequest) {
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers
    }
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        }
      }
    }
  )

  return { supabase, response: supabaseResponse }
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  // Skip middleware if Supabase credentials are not available
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[middleware] Supabase credentials not found, skipping auth middleware")
    return NextResponse.next()
  }

  // Use the consolidated client creation utility
  const { supabase, response } = createClient(request)

  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (!error) {
      user = data.user
    }
  } catch (error) {
    console.warn("[middleware] Auth check failed:", error)
  }

  const { pathname } = request.nextUrl

  // Logout is now handled client-side with supabase.auth.signOut()
  // No special middleware handling needed

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

  // Redirect authenticated users away from auth pages
  if (user && isAuthRoute) {
    // Skip redirect if user is on role selection page
    if (pathname === "/auth/select-role") {
      return response
    }

    // Get user profile and role to determine proper redirect
    try {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select(`
          roles(name)
        `)
        .eq("user_id", user.id)
        .single()

      const userRole = roleData?.roles?.name || null

      // If no role, redirect to role selection
      if (!userRole) {
        const redirectUrl = new URL("/auth/select-role", request.url)
        return NextResponse.redirect(redirectUrl)
      }

      // User has role, redirect to appropriate dashboard
      let dashboardPath = "/dashboard"
      switch (userRole) {
        case 'admin':
          dashboardPath = "/dashboard/admin"
          break
        case 'mentor':
          dashboardPath = "/dashboard/mentor"
          break
        case 'mentee':
          dashboardPath = "/dashboard/mentee"
          break
      }
      
      const redirectUrl = new URL(dashboardPath, request.url)
      return NextResponse.redirect(redirectUrl)
    } catch (error) {
      // If no role found, redirect to role selection
      const redirectUrl = new URL("/auth/select-role", request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Redirect unauthenticated users to login for protected routes
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Check admin access for admin routes
  if (isAdminRoute && user) {
    try {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select(`
          roles(name)
        `)
        .eq("user_id", user.id)
        .single()

      const userRole = roleData?.roles?.name
      const hasAdminAccess = userRole === "admin" || userRole === "moderator"

      if (!hasAdminAccess) {
        const redirectUrl = new URL("/unauthorized", request.url)
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      // If we can't verify admin status, deny access
      const redirectUrl = new URL("/unauthorized", request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Handle onboarding flow for authenticated users
  if (requiresOnboarding && user) {
    try {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select(`
          roles(name)
        `)
        .eq("user_id", user.id)
        .single()

      const userRole = roleData?.roles?.name || null

      // If user has no role, redirect to role selection
      if (!userRole) {
        if (pathname !== "/auth/select-role") {
          const redirectUrl = new URL("/auth/select-role", request.url)
          return NextResponse.redirect(redirectUrl)
        }
      } else {
        // User has a role, redirect away from role selection
        if (pathname === "/auth/select-role") {
          let dashboardPath = "/dashboard"
          switch (userRole) {
            case 'admin':
              dashboardPath = "/dashboard/admin"
              break
            case 'mentor':
              dashboardPath = "/dashboard/mentor"
              break
            case 'mentee':
              dashboardPath = "/dashboard/mentee"
              break
          }
          const redirectUrl = new URL(dashboardPath, request.url)
          return NextResponse.redirect(redirectUrl)
        }
      }
    } catch (error) {
      console.warn("[middleware] Failed to fetch user role:", error)
      // Fallback: redirect to role selection if no role found
      if (pathname !== "/auth/select-role") {
        const redirectUrl = new URL("/auth/select-role", request.url)
        return NextResponse.redirect(redirectUrl)
      }
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