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
    // Get user profile and role to determine proper redirect
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select(`
          verification_status, 
          full_name, 
          bio, 
          current_position, 
          mentor_skills,
          user_roles(
            roles(name)
          )
        `)
        .eq("id", user.id)
        .single()

      const userRole = profile?.user_roles?.[0]?.roles?.name || null

      const redirectPath = determineRedirect(
        userRole,
        profile?.verification_status,
        isProfileComplete(profile, userRole || "mentee")
      )
      
      const redirectUrl = new URL(redirectPath, request.url)
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
      const { data: profile } = await supabase
        .from("profiles")
        .select(`
          user_roles(
            roles(name)
          )
        `)
        .eq("id", user.id)
        .single()

      const userRole = profile?.user_roles?.[0]?.roles?.name
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
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_role, verification_status, full_name, bio, current_position, mentor_skills")
        .eq("id", user.id)
        .single()

      if (profile) {
        const userRole = profile.user_role
        
        // Check if user should skip role selection (already has a role)
        if (pathname === "/auth/select-role" && shouldSkipRoleSelection(userRole, profile.verification_status)) {
          const redirectPath = determineRedirect(
            userRole,
            profile.verification_status,
            isProfileComplete(profile, userRole || "mentee")
          )
          const redirectUrl = new URL(redirectPath, request.url)
          return NextResponse.redirect(redirectUrl)
        }

        // If user has pending role, redirect to role selection
        if (!userRole || userRole === "pending") {
          if (pathname !== "/auth/select-role") {
            const redirectUrl = new URL("/auth/select-role", request.url)
            return NextResponse.redirect(redirectUrl)
          }
        } else {
          // User has a role, check if they're authorized for current path
          if (!isAuthorizedForPath(pathname, userRole, profile.verification_status)) {
            const redirectPath = determineRedirect(
              userRole,
              profile.verification_status,
              isProfileComplete(profile, userRole)
            )
            const redirectUrl = new URL(redirectPath, request.url)
            return NextResponse.redirect(redirectUrl)
          }
        }
      }
    } catch (error) {
      console.warn("[middleware] Failed to fetch user profile:", error)
      // Fallback: redirect to role selection if no profile found
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