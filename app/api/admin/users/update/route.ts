import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { user_role } from '@/types/database'

export async function POST(request: Request) {
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

  const { userId, role } = await request.json()

  if (!userId || !role) {
    return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ role: role as user_role })
      .eq('id', userId)
      .select()

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'User role updated successfully', data: data[0] }, { status: 200 })
  } catch (error: any) {
    console.error('Error updating user role:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
