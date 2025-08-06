import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/dashboard'
  const role = searchParams.get('role') || 'mentee' // Get the role from query params

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // After successful sign-in, check if user profile exists and update role if necessary
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('id, role')
          .eq('id', user.id)
          .single()

        if (profileError && profileError.code === 'PGRST116') { // No rows found
          // Create new profile with the selected role
          await supabase.from('user_profiles').insert({
            id: user.id,
            full_name: user.user_metadata.full_name || user.user_metadata.user_name || user.email,
            email: user.email,
            role: role,
            is_profile_complete: false, // Mark as incomplete for first-time setup
          })
        } else if (profile && profile.role !== role) {
          // Optionally update role if it changed, or keep existing if preferred
          // For now, we'll assume the role selected during signup/login is the desired one
          await supabase.from('user_profiles').update({ role: role }).eq('id', user.id)
        }
      }
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(new URL('/auth/auth-error', request.url))
}
