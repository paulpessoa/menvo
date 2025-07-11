import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'


export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(req.url)
  const start = Number(searchParams.get('start')) || 0
  const end = Number(searchParams.get('end')) || 9
  
  const { data: user_profiles, error } = await supabase
  .from('user_profiles')
  .select('*')  // ou `some_column, other_table(foreign_key)`
  .range(start, end)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  
  return NextResponse.json({ profiles: user_profiles })
}


export async function PUT(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const body = await req.json()

  const { id, ...updateFields } = body

  if (!id) {
    return NextResponse.json({ error: 'Missing profile id' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updateFields)
    .eq('id', id)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data })
}
