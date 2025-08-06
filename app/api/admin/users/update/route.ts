import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createServiceRoleClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Check if the user is an admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const { userId, roles, status } = await req.json()

  if (!userId || !roles || !status) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // If admin, use service role client to update the user
  const supabaseService = createServiceRoleClient()
  const { error } = await supabaseService
    .from('profiles')
    .update({
      role: roles[0], // Assuming one role for now as per your UI
      status: status,
    })
    .eq('id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'User updated successfully' })
}
