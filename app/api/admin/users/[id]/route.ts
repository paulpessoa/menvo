import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const body = await req.json()
  // Atualiza perfil
  const { data: profile, error: profileError } = await supabase
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
      // ... outros campos editáveis
    })
    .eq('user_id', id)
    .select()
    .single()
  // Atualiza roles (opcional)
  if (body.roles) {
    // Remove todas as roles existentes
    await supabase.from('user_roles').delete().eq('user_id', id)
    // Insere novas roles
    for (const role of body.roles) {
      await supabase.from('user_roles').insert({
        user_id: id,
        role_type: role.role_type,
        status: role.status || 'active',
      })
    }
  }
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }
  return NextResponse.json(profile)
}
