import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
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

    // Calcular datas
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Buscar estatísticas
    const [totalResult, todayResult, weekResult, monthResult] = await Promise.all([
      // Total
      supabase
        .from('admin_audit_logs')
        .select('*', { count: 'exact', head: true }),
      
      // Hoje
      supabase
        .from('admin_audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString()),
      
      // Esta semana
      supabase
        .from('admin_audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString()),
      
      // Este mês
      supabase
        .from('admin_audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthAgo.toISOString())
    ])

    return NextResponse.json({
      total: totalResult.count || 0,
      today: todayResult.count || 0,
      thisWeek: weekResult.count || 0,
      thisMonth: monthResult.count || 0
    })

  } catch (error) {
    console.error('Erro ao buscar estatísticas de auditoria:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}