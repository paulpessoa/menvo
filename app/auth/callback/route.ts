import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("Error exchanging code for session:", error)
        return NextResponse.redirect(new URL("/login?error=auth_error", request.url))
      }

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single()

        if (profileError || !profile) {
          // Extract avatar URL from OAuth providers with priority
          const avatarUrl = data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null

          // Create profile if it doesn't exist
          const { error: createError } = await supabase.from("profiles").insert({
            id: data.user.id,
            email: data.user.email!,
            full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
            first_name: data.user.user_metadata?.given_name,
            last_name: data.user.user_metadata?.family_name,
            avatar_url: avatarUrl,
            role: "pending", // Will be set during onboarding
            status: "pending",
            verification_status: "pending",
          })

          if (createError) {
            console.error("Error creating profile:", createError)
          }

          // Redirect to role selection for new OAuth users
          return NextResponse.redirect(new URL("/onboarding/role-selection", request.url))
        } else {
          const oauthAvatar = data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture

          if (oauthAvatar && !profile.avatar_url) {
            await supabase.from("profiles").update({ avatar_url: oauthAvatar }).eq("id", data.user.id)
          }
        }
      }

      const redirectTo = requestUrl.searchParams.get("redirectTo")

      if (data.user) {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("role, status")
          .eq("id", data.user.id)
          .single()

        // If user needs role selection, redirect to onboarding
        if (!userProfile?.role || userProfile.role === "pending") {
          return NextResponse.redirect(new URL("/onboarding/role-selection", request.url))
        }

        // If user needs profile completion, redirect to profile
        if (userProfile.status === "pending") {
          return NextResponse.redirect(new URL("/profile?complete=true", request.url))
        }

        // Otherwise redirect to intended destination or dashboard
        return NextResponse.redirect(new URL(redirectTo || "/dashboard", request.url))
      }

      return NextResponse.redirect(new URL(redirectTo || "/dashboard", request.url))
    } catch (error) {
      console.error("Auth callback error:", error)
      return NextResponse.redirect(new URL("/login?error=callback_error", request.url))
    }
  }

  // No code provided, redirect to login
  return NextResponse.redirect(new URL("/login", request.url))
}
