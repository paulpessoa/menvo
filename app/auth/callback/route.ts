import { createClient } from "@/utils/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const supabase = await createClient()

  // Handle OAuth callback (code exchange)
  const code = requestUrl.searchParams.get("code")
  if (code) {
    try {
      console.log("🔄 OAuth callback - exchanging code for session...")
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("❌ Error exchanging code for session:", error)
        return NextResponse.redirect(
          new URL("/auth/error?error=oauth_error", request.url)
        )
      }

      console.log("✅ OAuth session exchange successful, user:", data.user?.id)

      if (data.user) {
        // Wait a moment for profile creation trigger
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Check if user has a role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select(`
            roles (
              name
            )
          `)
          .eq('user_id', data.user.id)
          .single()

        const redirectTo = requestUrl.searchParams.get("redirectTo")

        // If no role, redirect to role selection
        if (!(roleData?.roles as any)?.name) {
          return NextResponse.redirect(
            new URL("/auth/select-role", request.url)
          )
        }

        // Otherwise redirect to intended destination or dashboard
        return NextResponse.redirect(
          new URL(redirectTo || "/dashboard", request.url)
        )
      }

      return NextResponse.redirect(new URL("/dashboard", request.url))
    } catch (error) {
      console.error("OAuth callback error:", error)
      return NextResponse.redirect(
        new URL("/auth/error?error=callback_error", request.url)
      )
    }
  }

  // Handle email callback (token_hash verification)
  const tokenHash = requestUrl.searchParams.get("token_hash")
  const type = requestUrl.searchParams.get("type")

  if (tokenHash && type) {
    try {
      console.log(`🔄 Email callback - verifying ${type} token...`)
      
      let verifyResult
      let redirectPath = '/dashboard'

      switch (type) {
        case 'signup':
          // Email confirmation after registration
          verifyResult = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'signup'
          })
          redirectPath = '/auth/select-role'
          break

        case 'recovery':
          // Password recovery
          verifyResult = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery'
          })
          redirectPath = '/auth/reset-password'
          break

        case 'invite':
          // Admin invitation
          verifyResult = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'invite'
          })
          redirectPath = '/auth/set-password'
          break

        case 'magiclink':
          // Magic link login
          verifyResult = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'magiclink'
          })
          redirectPath = '/auth/select-role'
          break

        case 'email_change':
          // Email change confirmation
          verifyResult = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'email_change'
          })
          redirectPath = '/dashboard'
          break

        case 'reauthentication':
          // Reauthentication for sensitive operations
          verifyResult = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'reauthentication'
          })
          const next = requestUrl.searchParams.get("next")
          redirectPath = next || '/dashboard'
          break

        default:
          console.error(`❌ Unknown callback type: ${type}`)
          return NextResponse.redirect(
            new URL("/auth/error?error=unknown_callback_type", request.url)
          )
      }

      if (verifyResult.error) {
        console.error(`❌ Error verifying ${type} token:`, verifyResult.error)
        
        let errorParam = 'verification_error'
        if (verifyResult.error.message?.includes('expired')) {
          errorParam = 'token_expired'
        } else if (verifyResult.error.message?.includes('invalid')) {
          errorParam = 'token_invalid'
        } else if (verifyResult.error.message?.includes('already_confirmed')) {
          // For already confirmed, redirect to login
          return NextResponse.redirect(new URL("/auth/login?message=already_confirmed", request.url))
        }

        return NextResponse.redirect(
          new URL(`/auth/error?error=${errorParam}&type=${type}`, request.url)
        )
      }

      console.log(`✅ ${type} verification successful`)
      return NextResponse.redirect(new URL(redirectPath, request.url))

    } catch (error) {
      console.error(`Email callback error for ${type}:`, error)
      return NextResponse.redirect(
        new URL(`/auth/error?error=callback_error&type=${type}`, request.url)
      )
    }
  }

  // No valid callback parameters, redirect to login
  console.log("❌ No valid callback parameters found")
  return NextResponse.redirect(new URL("/auth/login", request.url))
}
