import { createClient } from "@/utils/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)

  // Tentar pegar code dos query params primeiro
  let code = requestUrl.searchParams.get("code")
  let type = requestUrl.searchParams.get("type")

  // Se não encontrar, tentar pegar do hash (fallback para links antigos)
  if (!code) {
    const hash = requestUrl.hash
    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1))
      code = hashParams.get("access_token") // Para formato antigo
      type = hashParams.get("type")
    }
  }

  console.log("🔍 AUTH CALLBACK - Start:", {
    code: code ? "present" : "missing",
    type,
    url: request.url
  })

  if (code) {
    const supabase = await createClient()

    try {
      console.log("🔄 Exchanging code for session...")
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("❌ Error exchanging code for session:", error)
        return NextResponse.redirect(
          new URL("/auth/error?error=auth_error", request.url)
        )
      }

      console.log("✅ Session exchange successful, user:", data.user?.id)

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single()

        if (profileError || !profile) {
          // Profile will be created automatically by trigger
          // Wait a moment for trigger to execute
          await new Promise((resolve) => setTimeout(resolve, 1000))

          // Try to fetch profile again
          const { data: newProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single()

          if (!newProfile) {
            console.error("Profile not created by trigger")
            return NextResponse.redirect(
              new URL("/auth/error?error=profile_creation_failed", request.url)
            )
          }

          // Redirect to role selection for new OAuth users without role
          if (!newProfile.role || newProfile.role === "pending") {
            return NextResponse.redirect(
              new URL("/onboarding/role-selection", request.url)
            )
          }
        } else {
          const oauthAvatar =
            data.user.user_metadata?.avatar_url ||
            data.user.user_metadata?.picture

          if (oauthAvatar && !profile.avatar_url) {
            await supabase
              .from("profiles")
              .update({ avatar_url: oauthAvatar })
              .eq("id", data.user.id)
          }
        }
      }

      const redirectTo = requestUrl.searchParams.get("redirectTo")

      if (data.user) {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("role, status, created_at")
          .eq("id", data.user.id)
          .single()

        // Check if this is an email confirmation (user just registered)
        const isEmailConfirmation =
          type === "signup" ||
          (userProfile &&
            new Date(userProfile.created_at) >
              new Date(Date.now() - 5 * 60 * 1000)) // Created in last 5 minutes

        console.log("📧 Email confirmation check:", {
          type,
          isEmailConfirmation,
          redirectTo,
          userProfile_created_at: userProfile?.created_at,
          minutes_ago: userProfile
            ? (Date.now() - new Date(userProfile.created_at).getTime()) /
              (1000 * 60)
            : null
        })

        // If this is an email confirmation, show confirmation page
        if (isEmailConfirmation && !redirectTo) {
          console.log("🎉 Redirecting to confirmation page")
          return NextResponse.redirect(new URL("/auth/confirmed", request.url))
        }

        // If user needs role selection, redirect to onboarding
        if (!userProfile?.role || userProfile.role === "pending") {
          return NextResponse.redirect(
            new URL("/onboarding/role-selection", request.url)
          )
        }

        // If user needs profile completion, redirect to profile
        if (userProfile.status === "pending") {
          return NextResponse.redirect(
            new URL("/profile?complete=true", request.url)
          )
        }

        // Otherwise redirect to intended destination or dashboard
        return NextResponse.redirect(
          new URL(redirectTo || "/dashboard", request.url)
        )
      }

      return NextResponse.redirect(
        new URL(redirectTo || "/dashboard", request.url)
      )
    } catch (error) {
      console.error("Auth callback error:", error)
      return NextResponse.redirect(
        new URL("/auth/error?error=callback_error", request.url)
      )
    }
  }

  // No code provided, redirect to login
  return NextResponse.redirect(new URL("/login", request.url))
}
