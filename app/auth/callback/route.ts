import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/dashboard'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // After successful sign-in, check if user profile exists and redirect to welcome if not complete
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('is_profile_complete')
          .eq('id', user.id)
          .single()

        if (profileError && profileError.code === 'PGRST116') { // No rows found
          // This means a new user signed up via OAuth and no profile was created yet.
          // Redirect to welcome page to complete profile and set role.
          return NextResponse.redirect(new URL('/welcome', request.url))
        } else if (profile && !profile.is_profile_complete) {
          // Existing user but profile not complete
          return NextResponse.redirect(new URL('/welcome', request.url))
        }
      }
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(new URL('/auth/auth-error', request.url))
}
