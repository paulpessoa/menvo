import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase/server'
import { logAdminAction } from '@/lib/audit-logger'
import type { Database } from '@/lib/types/supabase'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type ProfileWithRoles = ProfileRow & {
  user_roles: { roles: { name: string } | null }[]
}

// GET - Listar usuários com filtros e paginação
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Verificar se usuário é admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar role de admin
    const { data: roleDataResult, error: roleError } = await supabase
      .from('user_roles')
      .select(`
        roles (
          name
        )
      `)
      .eq('user_id', user.id)
      
    const userRoles = roleDataResult as any;

    if (roleError || !userRoles?.some((ur: any) => ur.roles?.name === 'admin')) {
      return NextResponse.json({ error: 'Acesso negado - apenas admins' }, { status: 403 })
    }

    // Parâmetros de busca
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const roleFilter = searchParams.get('role') || ''
    const statusFilter = searchParams.get('status') || ''
    
    const offset = (page - 1) * limit

    // Construir query base
    let query = supabase
      .from('profiles')
      .select(`
        id,
        email,
        first_name,
        last_name,
        full_name,
        verified,
        is_volunteer,
        created_at,
        user_roles (
          roles (
            name
          )
        )
      `, { count: 'exact' })

    // Aplicar filtros
    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    if (statusFilter) {
      const verified = statusFilter === 'verified'
      query = query.eq('verified', verified)
    }

    // Executar query principal
    const { data: rawProfiles, error: profilesError, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    const profiles = rawProfiles as unknown as ProfileWithRoles[] | null;

    if (profilesError) {
      throw profilesError
    }

    // Processar dados dos usuários
    const users = (profiles || []).map(profile => {
      const userRole = profile.user_roles?.[0]?.roles?.name || 'mentee'
      
      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        user_role: userRole,
        verification_status: profile.verified ? 'verified' : 'pending',
        is_volunteer: profile.is_volunteer || false,
        created_at: profile.created_at
      }
    })

    // Filtrar por role se especificado
    const filteredUsers = roleFilter 
      ? users.filter(user => user.user_role === roleFilter)
      : users

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      users: filteredUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
