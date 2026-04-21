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

  // --- FIX 20-04-26 PRIORITÁRIO ---
  // Se for callback de autenticação, NUNCA redirecione ou mude o caminho.
  // Isso blinda o processo contra erros 404 e perda de PKCE verifier.
  if (pathname === '/auth/callback' || pathname.startsWith('/auth/callback')) {
    return NextResponse.next()
  }

  // 1. Detect and redirect legacy /auth/* paths to clean paths
  const locales = routing.locales
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/auth/`)) {
      const subPath = pathname.replace(`/${locale}/auth/`, "")
      if (subPath !== "callback") {
        const cleanPath = `/${locale}/${subPath}`
        return NextResponse.redirect(new URL(cleanPath, request.url))
      }
    }
  }

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

  // Strip locale prefix for route matching
  const pathnameWithoutLocale = locales.reduce(
    (acc, locale) => acc.replace(new RegExp(`^/${locale}`), ""),
    pathname
  ) || "/"

  // Auth Protection Logic
  const isProtectedRoute = protectedRoutes.some(route => pathnameWithoutLocale.startsWith(route))
  
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return response
}

export const config = {
  matcher: [
    // Match all paths including localized ones
    // Exclude static files and internal paths
    "/((?!api|_next/static|_next/image|favicon.ico|site\\.webmanifest|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
}
