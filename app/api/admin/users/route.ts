import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { user_profile } from '@/types/database'

export async function GET(request: Request) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if the user is an admin
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { data: usersData, error: usersError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        full_name,
        username,
        role,
        is_profile_complete,
        verified_at,
        created_at,
        auth_users (
          email
        )
      `)

    if (usersError) {
      throw usersError
    }

    const formattedUsers = usersData.map(profile => ({
      id: profile.id,
      full_name: profile.full_name,
      username: profile.username,
      role: profile.role,
      is_profile_complete: profile.is_profile_complete,
      verified_at: profile.verified_at,
      created_at: profile.created_at,
      email: profile.auth_users?.email || 'N/A' // Access email from the joined auth_users table
    }))

    return NextResponse.json({ data: formattedUsers }, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching users:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
