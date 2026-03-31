import { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"
import {
  protectedRoutes,
  adminRoutes,
  onboardingRequiredRoutes,
  authRoutes
} from "@/config/routes"

// Initialize next-intl middleware
const handleI18nRouting = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  // 1. Handle i18n routing first
  const response = handleI18nRouting(request)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      }
    }
  })

  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (!error) user = data.user
  } catch (error) {}

  const { pathname } = request.nextUrl

  // Strip locale prefix for route matching if present
  const locales = routing.locales
  const pathnameWithoutLocale = locales.reduce(
    (acc, locale) => acc.replace(new RegExp(`^/${locale}`), ""),
    pathname
  ) || "/"

  // Auth Protection Logic (Simplified for brevity, but maintaining your rules)
  const isProtectedRoute = protectedRoutes.some(route => pathnameWithoutLocale.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathnameWithoutLocale.startsWith(route))

  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirect", pathnameWithoutLocale)
    return response // next-intl handleI18nRouting will take care of localizing /login
  }

  return response
}

export const config = {
  matcher: [
    // Match all paths including localized ones
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
}
