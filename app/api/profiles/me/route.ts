import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Busca dados do perfil
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 404 })
  }

  // Mescla dados do auth e do profile
  const fullProfile = {
    ...user,
    ...profile,
    // Se quiser, pode separar os campos para evitar sobrescrever
    // auth: user,
    // profile: profile,
  }

  return NextResponse.json(fullProfile)
}

export async function PATCH(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  // O método getUser() é assíncrono!
  const { data: { user }, error } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  const body = await req.json()
  const { data, error: updateError } = await supabase
    .from('user_profiles')
    .update({
      first_name: body.first_name,
      last_name: body.last_name,
      bio: body.bio,
      avatar_url: body.avatar_url,
      current_position: body.current_position,
      current_company: body.current_company,
      location: body.location,
      phone: body.phone,
    })
    .eq('user_id', user.id)
    .select()
    .single()
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }
  return NextResponse.json(data)
}
