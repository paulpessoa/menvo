import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service'

export async function GET(request: Request) {
  const supabase = createServiceRoleClient()
  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role')

  let query = supabase.from('profiles').select('*')

  if (role) {
    query = query.eq('role', role)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
