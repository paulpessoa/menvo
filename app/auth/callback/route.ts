import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

/**
 * Single Source of Truth for Auth Callbacks.
 * Handles PKCE code exchange, role-based redirection, and locale preservation.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const type = searchParams.get("type")
  const next = searchParams.get("next") || "/dashboard"

  // 1. Detect Locale (Priority: Cookie -> Default)
  const cookieStore = await cookies()
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "pt-BR"

  // 2. Prepare Base Redirect URL
  const getTargetUrl = (path: string) => {
    const cleanPath = path.startsWith("/") ? path : `/${path}`
    return new URL(`/${locale}${cleanPath}`, origin)
  }

  // Handle password recovery flow
  if (type === "recovery") {
    return NextResponse.redirect(getTargetUrl("/update-password"))
  }

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          }
        }
      }
    )

    // 3. Exchange code for session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error("Auth exchange error:", exchangeError)
      return NextResponse.redirect(getTargetUrl(`/login?error=auth_failed`))
    }

    // 4. Fetch Profile & Roles for smart redirection
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*, user_roles!inner(roles(name))")
        .eq("id", user.id)
        .maybeSingle()

      // Redirect based on roles
      if (profile) {
        const roles = (profile.user_roles as any[])?.map((ur: any) => ur.roles?.name) || []
        
        if (roles.includes("admin")) {
          return NextResponse.redirect(getTargetUrl(next === "/dashboard" ? "/dashboard/admin" : next))
        }
        
        if (roles.includes("mentor")) {
          return NextResponse.redirect(getTargetUrl(next === "/dashboard" ? "/dashboard/mentor" : next))
        }
        
        // Default to mentee dashboard
        return NextResponse.redirect(getTargetUrl(next === "/dashboard" ? "/dashboard/mentee" : next))
      } else {
        // First time login or profile not setup - MANDAR PARA PERFIL CONFORME SOLICITADO
        return NextResponse.redirect(getTargetUrl("/profile"))
      }
    }
  }

  // Final fallback
  return NextResponse.redirect(getTargetUrl(next))
}
