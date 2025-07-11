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

      // Check if user has a profile
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single()

        if (profileError || !profile) {
          // Create profile if it doesn't exist
          const { error: createError } = await supabase.from("profiles").insert({
            id: data.user.id,
            email: data.user.email!,
            full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
            first_name: data.user.user_metadata?.given_name,
            last_name: data.user.user_metadata?.family_name,
            avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture,
            role: "mentee", // Default role
            status: "pending",
            verification_status: "pending",
          })

          if (createError) {
            console.error("Error creating profile:", createError)
          }
        }
      }

      // Redirect to dashboard or intended page
      const redirectTo = requestUrl.searchParams.get("redirectTo") || "/dashboard"
      return NextResponse.redirect(new URL(redirectTo, request.url))
    } catch (error) {
      console.error("Auth callback error:", error)
      return NextResponse.redirect(new URL("/login?error=callback_error", request.url))
    }
  }

  // No code provided, redirect to login
  return NextResponse.redirect(new URL("/login", request.url))
}
