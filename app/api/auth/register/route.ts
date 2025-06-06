import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { email, password, firstName, lastName, role } = await request.json()

    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    // Registrar o usuário no Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role
        }
      }
    })

    if (authError) {
      return NextResponse.json(
        { error: 'Erro ao registrar usuário', details: authError.message },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase.auth.updateUser({
    data: {
      role: [role]
    }
  })

   if (updateError) {
      return NextResponse.json(
        { error: 'Erro ao registrar informacoes do usuário', details: updateError.message },
        { status: 400 }
      )
    }

    // 2. Adicionar à tabela users (se o usuário foi criado)
    if (authData.user) {
      const { error: dbError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          role: role,
          status: 'pending'
        }])

      if (dbError) {
        console.error('Erro ao inserir na tabela users:', dbError)
        // Não retorna erro aqui pois o usuário já foi criado na auth
      }
    }

    return NextResponse.json({
      message: 'Usuário registrado com sucesso',
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
        first_name: firstName,
        last_name: lastName,
        role: role
      }
    })

  } catch (error) {
    console.error('Erro no endpoint de registro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}