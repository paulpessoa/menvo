import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { logAdminAction } from '@/lib/audit-logger'

// GET - Listar usuários com filtros e paginação
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
    const { data: profiles, error: profilesError, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (profilesError) {
      throw profilesError
    }

    // Processar dados dos usuários
    const users = profiles?.map(profile => {
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
    }) || []

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
    console.error('Erro ao buscar usuários:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo usuário
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
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

    const { email, password, full_name, user_role } = body

    // Validações básicas
    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 })
    }

    // Criar usuário no Supabase Auth
    const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        created_by_admin: true
      }
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // Criar perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email,
        full_name,
        verified: true // Usuários criados por admin são automaticamente verificados
      })

    if (profileError) {
      // Se falhar ao criar perfil, deletar usuário criado
      await supabase.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json({ error: 'Erro ao criar perfil do usuário' }, { status: 500 })
    }

    // Atribuir role
    if (user_role && user_role !== 'mentee') {
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', user_role)
        .single()

      if (roleData) {
        await supabase
          .from('user_roles')
          .insert({
            user_id: authUser.user.id,
            role_id: roleData.id
          })
      }
    }

    // Log de auditoria
    await logAdminAction(
      user.id,
      'user_created',
      {
        created_user_email: email,
        created_user_role: user_role,
        full_name
      },
      authUser.user.id,
      email,
      request
    )

    return NextResponse.json({
      success: true,
      user: {
        id: authUser.user.id,
        email,
        full_name,
        user_role
      }
    })

  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar usuário
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
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

    const { userId, updates } = body

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 })
    }

    // Atualizar perfil
    const profileUpdates: any = {}
    if (updates.full_name !== undefined) profileUpdates.full_name = updates.full_name
    if (updates.email !== undefined) profileUpdates.email = updates.email

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId)

      if (profileError) {
        return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
      }
    }

    // Atualizar email no Auth se necessário
    if (updates.email) {
      const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
        email: updates.email
      })

      if (authError) {
        return NextResponse.json({ error: 'Erro ao atualizar email no sistema de autenticação' }, { status: 500 })
      }
    }

    // Atualizar role se necessário
    if (updates.user_role) {
      // Remover roles existentes
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)

      // Adicionar nova role se não for mentee (role padrão)
      if (updates.user_role !== 'mentee') {
        const { data: roleData } = await supabase
          .from('roles')
          .select('id')
          .eq('name', updates.user_role)
          .single()

        if (roleData) {
          await supabase
            .from('user_roles')
            .insert({
              user_id: userId,
              role_id: roleData.id
            })
        }
      }
    }

    // Log de auditoria
    await logAdminAction(
      user.id,
      'user_updated',
      { updates },
      userId,
      updates.email,
      request
    )

    return NextResponse.json({
      success: true,
      message: 'Usuário atualizado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar usuário
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
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

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 })
    }

    // Verificar se não está tentando deletar a si mesmo
    if (userId === user.id) {
      return NextResponse.json({ error: 'Você não pode deletar sua própria conta' }, { status: 400 })
    }

    // Buscar dados do usuário para log
    const { data: userToDelete } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single()

    // Deletar usuário do Auth (isso cascateará para as outras tabelas)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)

    if (deleteError) {
      return NextResponse.json({ error: 'Erro ao deletar usuário' }, { status: 500 })
    }

    // Log de auditoria
    await logAdminAction(
      user.id,
      'user_deleted',
      {
        deleted_user_email: userToDelete?.email,
        deleted_user_name: userToDelete?.full_name
      },
      userId,
      userToDelete?.email,
      request
    )

    return NextResponse.json({
      success: true,
      message: 'Usuário deletado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}