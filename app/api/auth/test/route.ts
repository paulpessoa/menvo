import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError) {
    console.error('Auth error:', authError)
    return NextResponse.json({ isAuthenticated: false, error: authError.message }, { status: 401 })
  }

  if (!user) {
    return NextResponse.json({ isAuthenticated: false, message: 'No active session' }, { status: 401 })
  }

  // Fetch user profile to get role
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role, full_name, username, is_profile_complete, verified_at')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Profile fetch error:', profileError)
    return NextResponse.json({ isAuthenticated: true, user: user.id, email: user.email, profile: null, error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({
    isAuthenticated: true,
    user: {
      id: user.id,
      email: user.email,
      role: profile?.role,
      full_name: profile?.full_name,
      username: profile?.username,
      is_profile_complete: profile?.is_profile_complete,
      verified_at: profile?.verified_at,
      // Add other user metadata if needed
    },
  }, { status: 200 })
}
