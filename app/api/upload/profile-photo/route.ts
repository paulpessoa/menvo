import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'



export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const formData = await req.formData()
  const file = formData.get('file') as File
  const userId = req.nextUrl.searchParams.get('userId')
  if (!file || !userId) return NextResponse.json({ error: 'Missing file or userId' }, { status: 400 })

  const arrayBuffer = await file.arrayBuffer()
  const { data, error } = await supabase.storage
    .from('profile-photos')
    .upload(`${userId}/${file.name}`, new Uint8Array(arrayBuffer), { upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const url = supabase.storage.from('profile-photos').getPublicUrl(`${userId}/${file.name}`).data.publicUrl
  return NextResponse.json({ url })
}
