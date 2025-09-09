import { NextRequest, NextResponse } from 'next/server'
import { getAuditLogs } from '@/lib/audit-logger'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    // Verificar se usuário é admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar role de admin
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select(`
        roles (
          name
        )
      `)
      .eq('user_id', user.id)

    if (roleError || !userRoles?.some((ur: any) => ur.roles?.name === 'admin')) {
      return NextResponse.json({ error: 'Acesso negado - apenas admins' }, { status: 403 })
    }

    // Parâmetros de busca
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const action = searchParams.get('action') || ''

    // Buscar logs usando a função do audit-logger
    const result = await getAuditLogs(page, limit, undefined, action)

    // Filtrar por busca se especificado
    let filteredLogs = result.logs
    if (search) {
      const searchLower = search.toLowerCase()
      filteredLogs = result.logs.filter(log => 
        log.admin?.email?.toLowerCase().includes(searchLower) ||
        log.admin?.full_name?.toLowerCase().includes(searchLower) ||
        log.target_user_email?.toLowerCase().includes(searchLower) ||
        log.target?.full_name?.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json({
      logs: filteredLogs,
      pagination: result.pagination
    })

  } catch (error) {
    console.error('Erro ao buscar logs de auditoria:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
