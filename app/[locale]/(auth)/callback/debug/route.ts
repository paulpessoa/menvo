import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const type = requestUrl.searchParams.get("type")
  const redirectTo = requestUrl.searchParams.get("redirectTo")

  console.log("🔍 DEBUG - Callback parameters:", {
    code: code ? "present" : "missing",
    type,
    redirectTo,
    fullUrl: request.url
  })

  if (!code) {
    return NextResponse.json({
      error: "No code provided",
      url: request.url,
      searchParams: Object.fromEntries(requestUrl.searchParams)
    })
  }

  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    console.log("🔄 Exchanging code for session...")
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("❌ Error exchanging code:", error)
      return NextResponse.json({
        error: "Failed to exchange code",
        details: error.message,
        code: error.status
      })
    }

    console.log("✅ Session created for user:", data.user?.id)

    if (data.user) {
      console.log("👤 User data:", {
        id: data.user.id,
        email: data.user.email,
        email_confirmed_at: data.user.email_confirmed_at,
        created_at: data.user.created_at
      })

      // Check profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single()

      if (profileError) {
        console.error("❌ Profile error:", profileError)
        return NextResponse.json({
          error: "Profile fetch failed",
          details: profileError.message,
          user_id: data.user.id
        })
      }

      console.log("👤 Profile data:", profile)

      // Check if this is an email confirmation
      const isEmailConfirmation = type === "signup" || 
        (profile && new Date(profile.created_at) > new Date(Date.now() - 5 * 60 * 1000))

      console.log("📧 Email confirmation check:", {
        type,
        isEmailConfirmation,
        profile_created_at: profile?.created_at,
        minutes_ago: profile ? (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60) : null
      })

      return NextResponse.json({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          email_confirmed_at: data.user.email_confirmed_at
        },
        profile: profile,
        isEmailConfirmation,
        nextStep: isEmailConfirmation && !redirectTo ? "confirmed" : 
                 (!profile?.role || profile.role === "pending") ? "role-selection" :
                 profile.status === "pending" ? "profile-completion" : "dashboard"
      })
    }

    return NextResponse.json({
      error: "No user in session data",
      data
    })

  } catch (error) {
    console.error("💥 Callback error:", error)
    return NextResponse.json({
      error: "Callback processing failed",
      details: error instanceof Error ? error.message : "Unknown error"
    })
  }
}