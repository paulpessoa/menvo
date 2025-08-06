import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!user) {
    return NextResponse.json({ message: 'No user logged in' }, { status: 401 })
  }

  return NextResponse.json({ user: user.email, id: user.id, role: user.user_metadata?.role })
}
