import { createClient } from "@/utils/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const supabase = await createClient()

  // Check if this is an email callback first (has type parameter)
  const type = requestUrl.searchParams.get("type")
  const code = requestUrl.searchParams.get("code")
  const tokenHash = requestUrl.searchParams.get("token_hash")

  // Handle email callback (token_hash or code with type)
  if (type && (tokenHash || code)) {
    try {
      
      let verifyResult
      let redirectPath = '/dashboard'

      switch (type) {
        case 'signup':
          // Email confirmation after registration
          if (tokenHash) {
            verifyResult = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'signup'
            })
          } else if (code) {
            verifyResult = await supabase.auth.exchangeCodeForSession(code)
          }
          
          // Check if user already has a role after email confirmation
          if (verifyResult.data?.user) {
            const { data: roleData } = await supabase
              .from('user_roles')
              .select(`roles (name)`)
              .eq('user_id', verifyResult.data.user.id)
              .single()
            
            const roleName = (roleData?.roles as any)?.name
            if (roleName) {
              // User has role, redirect to appropriate dashboard
              switch (roleName) {
                case 'admin':
                  redirectPath = '/dashboard/admin'
                  break
                case 'mentor':
                  redirectPath = '/dashboard/mentor'
                  break
                case 'mentee':
                  redirectPath = '/dashboard/mentee'
                  break
                default:
                  redirectPath = '/dashboard'
              }
            } else {
              redirectPath = '/auth/select-role'
            }
          } else {
            redirectPath = '/auth/select-role'
          }
          break

        case 'recovery':
          // Password recovery
          if (tokenHash) {
            verifyResult = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'recovery'
            })
          } else if (code) {
            verifyResult = await supabase.auth.exchangeCodeForSession(code)
          }
          redirectPath = '/auth/reset-password'
          break

        case 'invite':
          // Admin invitation
          if (tokenHash) {
            verifyResult = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'invite'
            })
          } else if (code) {
            verifyResult = await supabase.auth.exchangeCodeForSession(code)
          }
          redirectPath = '/auth/set-password'
          break

        case 'magiclink':
          // Magic link login
          if (tokenHash) {
            verifyResult = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'magiclink'
            })
          } else if (code) {
            verifyResult = await supabase.auth.exchangeCodeForSession(code)
          }
          
          // Check if user has a role for magic link login
          if (verifyResult.data?.user) {
            const { data: roleData } = await supabase
              .from('user_roles')
              .select(`roles (name)`)
              .eq('user_id', verifyResult.data.user.id)
              .single()
            
            const roleName = (roleData?.roles as any)?.name
            if (roleName) {
              // User has role, redirect to appropriate dashboard
              switch (roleName) {
                case 'admin':
                  redirectPath = '/dashboard/admin'
                  break
                case 'mentor':
                  redirectPath = '/dashboard/mentor'
                  break
                case 'mentee':
                  redirectPath = '/dashboard/mentee'
                  break
                default:
                  redirectPath = '/dashboard'
              }
            } else {
              redirectPath = '/auth/select-role'
            }
          } else {
            redirectPath = '/auth/select-role'
          }
          break

        case 'email_change':
          // Email change confirmation
          if (tokenHash) {
            verifyResult = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'email_change'
            })
          } else if (code) {
            verifyResult = await supabase.auth.exchangeCodeForSession(code)
          }
          redirectPath = '/dashboard'
          break

        case 'reauthentication':
          // Reauthentication for sensitive operations
          if (tokenHash) {
            verifyResult = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'reauthentication'
            })
          } else if (code) {
            verifyResult = await supabase.auth.exchangeCodeForSession(code)
          }
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

      return NextResponse.redirect(new URL(redirectPath, request.url))

    } catch (error) {
      console.error(`Email callback error for ${type}:`, error)
      return NextResponse.redirect(
        new URL(`/auth/error?error=callback_error&type=${type}`, request.url)
      )
    }
  }

  // Handle OAuth callback (code exchange without type)
  if (code && !type) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("❌ Error exchanging code for session:", error)
        return NextResponse.redirect(
          new URL("/auth/error?error=oauth_error", request.url)
        )
      }

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
        const roleName = (roleData?.roles as any)?.name

        // If no role, redirect to role selection
        if (!roleName) {
          return NextResponse.redirect(
            new URL("/auth/select-role", request.url)
          )
        }

        // Role-based redirection logic
        let dashboardPath = "/dashboard"
        
        switch (roleName) {
          case 'admin':
            dashboardPath = "/dashboard/admin"
            break
          case 'mentor':
            dashboardPath = "/dashboard/mentor"
            break
          case 'mentee':
            dashboardPath = "/dashboard/mentee"
            break
          default:
            dashboardPath = "/dashboard"
        }

        // Use redirectTo if provided and valid, otherwise use role-based dashboard
        const finalRedirect = redirectTo || dashboardPath
        
        return NextResponse.redirect(
          new URL(finalRedirect, request.url)
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

  // No valid callback parameters, redirect to login
  return NextResponse.redirect(new URL("/auth/login", request.url))
}
