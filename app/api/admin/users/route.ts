import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  // Busca todos os perfis
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('*')
  // Busca todas as roles
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id, role_type, status')
  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 })
  }
  // Junta perfis e roles
  const users = profiles.map(profile => ({
    ...profile,
    roles: (roles || []).filter(r => r.user_id === profile.user_id)
  }))
  return NextResponse.json({ users })
} 