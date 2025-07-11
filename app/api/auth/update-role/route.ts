import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseServerClient()
    
    // Verificar se usuário está autenticado
 const { data, error } = await ( await supabaseAdmin).auth.admin.updateUserById(
    userId,
    {
      app_metadata: { role: 'pending' }
    }
  )    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Obter dados da requisição
    const { role } = await request.json()
    
    if (!role || !['mentor', 'mentee', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Role inválida' },
        { status: 400 }
      )
    }

    // Atualizar role no JWT
    const { error: updateError } = await supabase.auth.updateUser({
      data: { role: role }
    })

    if (updateError) {
      console.error('Erro ao atualizar role no JWT:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar role no JWT' },
        { status: 500 }
      )
    }

    // Inserir/atualizar role na tabela profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        role: role,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('Erro ao atualizar perfil:', profileError)
      return NextResponse.json(
        { error: 'Erro ao atualizar perfil' },
        { status: 500 }
      )
    }

    // Refresh da sessão para aplicar mudanças
    await supabase.auth.refreshSession()

    return NextResponse.json(
      { 
        success: true, 
        message: 'Role atualizada com sucesso',
        role: role
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Erro no endpoint update-role:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 