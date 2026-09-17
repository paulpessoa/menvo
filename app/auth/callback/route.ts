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
      // Multi-tenant Phase 1: tag the account with the org it signed up
      // through (see /o/[slug]/signup + docs/MULTI_TENANT_ROADMAP.md §4).
      // Metadata survives the confirm-email gap; the actual insert has to
      // wait until here, once we have a confirmed, authenticated session.
      const pendingOrgSlug = (user.user_metadata as any)?.pending_organization_slug as
        | string
        | undefined

      if (pendingOrgSlug) {
        const { data: organization } = await supabase
          .from("organizations" as any)
          .select("id")
          .eq("slug", pendingOrgSlug)
          .eq("status", "active")
          .maybeSingle()

        if (organization) {
          const orgId = (organization as any).id as string

          const { data: existingMembership } = await supabase
            .from("organization_members" as any)
            .select("organization_id")
            .eq("organization_id", orgId)
            .eq("user_id", user.id)
            .maybeSingle()

          if (!existingMembership) {
            await supabase
              .from("organization_members" as any)
              .insert({ organization_id: orgId, user_id: user.id, role: "member" } as any)
          }

          // Org beneficiaries are plain mentee accounts (founder's call,
          // roadmap §1.2) — skip onboarding's role picker for them.
          const { data: existingRoles } = await supabase
            .from("user_roles")
            .select("id")
            .eq("user_id", user.id)

          if (!existingRoles || existingRoles.length === 0) {
            const { data: menteeRole } = await supabase
              .from("roles")
              .select("id")
              .eq("name", "mentee")
              .maybeSingle()

            if (menteeRole) {
              await supabase
                .from("user_roles")
                .insert({ user_id: user.id, role_id: (menteeRole as any).id } as any)
            }
          }
        }
      }

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
