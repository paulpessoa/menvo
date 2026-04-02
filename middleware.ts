import { NextRequest, NextResponse } from "next/server"
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
  const { pathname } = request.nextUrl

  // 1. Detect and redirect legacy /auth/* paths to clean paths
  // This handles URLs like /pt-BR/auth/login -> /pt-BR/login
  const locales = routing.locales
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/auth/`)) {
      const subPath = pathname.replace(`/${locale}/auth/`, "")
      // Don't redirect the callback, which is internal to Supabase
      if (subPath !== "callback") {
        const cleanPath = `/${locale}/${subPath}`
        return NextResponse.redirect(new URL(cleanPath, request.url))
      }
    }
  }

  // Handle case without locale prefix: /auth/login -> /login (next-intl will add locale later)
  if (pathname.startsWith("/auth/") && !pathname.startsWith("/auth/callback")) {
    const cleanPath = pathname.replace("/auth/", "/")
    return NextResponse.redirect(new URL(cleanPath, request.url))
  }

  // 2. Handle i18n routing
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

  // Strip locale prefix for route matching if present
  const pathnameWithoutLocale = locales.reduce(
    (acc, locale) => acc.replace(new RegExp(`^/${locale}`), ""),
    pathname
  ) || "/"

  // Auth Protection Logic
  const isProtectedRoute = protectedRoutes.some(route => pathnameWithoutLocale.startsWith(route))
  
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirect", pathnameWithoutLocale)
    // The response from next-intl already has the correct locale if needed
    // or we redirect to /login and let next-intl handle it
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return response
}

export const config = {
  matcher: [
    // Match all paths including localized ones
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
}
