import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })
  const { id } = params
  // Busca perfil
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', id)
    .single()
  // Busca roles
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('role_type, status')
    .eq('user_id', id)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 404 })
  }
  return NextResponse.json({ ...profile, roles: roles || [] })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const body = await req.json()
  // Atualiza perfil
  const { data, error } = await supabase
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
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json(data)
} 

// export async function GET(req: NextRequest) {
//   const token = req.headers.get('Authorization')?.replace('Bearer ', '')

//   if (!token) {
//     return NextResponse.json({ error: 'No token provided' }, { status: 401 })
//   }

//   const { data: { user }, error: userError } = await supabase.auth.getUser(token)

//   if (userError || !user) {
//     return NextResponse.json({ error: userError?.message || 'User not found' }, { status: 400 })
//   }

//   const { data: user_profiles, error: profileError } = await supabase
//     .from('user_profiles')
//     .select('*')   // ou 'some_column, other_column'
//     .eq('user_id', user.id)

//   if (profileError) {
//     return NextResponse.json({ error: profileError.message }, { status: 400 })
//   }

//   return NextResponse.json({ profile: user_profiles })
// }

// export async function PUT(req: NextRequest) {
//   const token = req.headers.get('Authorization')?.replace('Bearer ', '')

//   if (!token) {
//     return NextResponse.json({ error: 'No token provided' }, { status: 401 })
//   }

//   const { data: { user }, error: userError } = await supabase.auth.getUser(token)

//   if (userError || !user) {
//     return NextResponse.json({ error: userError?.message || 'User not found' }, { status: 400 })
//   }

//   const body = await req.json()

//   const { data, error } = await supabase
//     .from('user_profiles')
//     .update(body)  // Exemplo: { other_column: 'otherValue' }
//     .eq('user_id', user.id)
//     .select()

//   if (error) {
//     return NextResponse.json({ error: error.message }, { status: 400 })
//   }

//   return NextResponse.json({ profile: data })
// }
