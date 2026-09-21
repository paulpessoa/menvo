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
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")
  const errorCode = searchParams.get("error_code")

  // 1. Detect Locale (Priority: Cookie -> Default)
  const cookieStore = await cookies()
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "pt-BR"

  // 2. Prepare Base Redirect URL
  const getTargetUrl = (path: string) => {
    const cleanPath = path.startsWith("/") ? path : `/${path}`
    return new URL(`/${locale}${cleanPath}`, origin)
  }

  if (error || errorCode) {
    console.error("Auth callback error:", error || errorCode, errorDescription)
    return NextResponse.redirect(getTargetUrl(`/login?error=${encodeURIComponent(errorDescription || error || errorCode || "auth_failed")}`))
  }

  // Handle password recovery and first-time invite flows. This only works
  // when `type` was baked into the redirect_to URL by whoever generated the
  // link in the first place (e.g. resetPasswordForEmail's redirectTo:
  // ".../auth/callback?type=recovery" in forgot-password/page.tsx and
  // invite-batch/route.ts) — Supabase does NOT add `type` as a query
  // param on its own. Its actual session payload (access_token,
  // refresh_token, and its own `type`) arrives as a URL HASH FRAGMENT,
  // which browsers never send to the server, so this route can only see
  // `type` when a caller explicitly duplicates it into the query string
  // like the two callers above do. Confirmed via a live invite link that
  // Supabase's real redirect carries nothing here otherwise — callers that
  // need this route to route correctly must follow the same convention.
  // (The waiting-list invite flow sidesteps this entirely by pointing
  // redirect_to straight at /update-password — see
  // app/api/admin/waiting-list/create-account/route.ts.)
  if (type === "recovery" || type === "invite") {
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
        .select("*, user_roles(roles(name))")
        .eq("id", user.id)
        .maybeSingle()

      // Redirect based on roles
      if (profile) {
        const roles = (profile.user_roles as any[])
          ?.map((ur: any) => ur.roles?.name)
          .filter(Boolean) || []
        
        if (roles.includes("admin")) {
          return NextResponse.redirect(getTargetUrl(next === "/dashboard" ? "/dashboard/admin" : next))
        }
        
        if (roles.includes("mentor")) {
          return NextResponse.redirect(getTargetUrl(next === "/dashboard" ? "/dashboard/mentor" : next))
        }

        if (roles.includes("mentee")) {
          return NextResponse.redirect(getTargetUrl(next === "/dashboard" ? "/dashboard/mentee" : next))
        }
        
        // No role assigned yet -> route to onboarding
        return NextResponse.redirect(getTargetUrl("/onboarding"))
      } else {
        // First time login or profile not setup -> send to onboarding
        return NextResponse.redirect(getTargetUrl("/onboarding"))
      }
    }
  }

  // Final fallback
  return NextResponse.redirect(getTargetUrl(next))
}
