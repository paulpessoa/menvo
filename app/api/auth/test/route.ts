import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    return NextResponse.json({ message: `Hello, ${user.email}! You are authenticated.` })
  } else {
    return NextResponse.json({ message: 'You are not authenticated.' }, { status: 401 })
  }
}
