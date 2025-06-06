import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/api-utils'

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao verificar autenticação', details: error.message },
        { status: 401 }
      )
    }

    if (!session) {
      return NextResponse.json(
        { authenticated: false, message: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Se chegou aqui, o usuário está autenticado
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        // Incluindo o token para debug
        access_token: session.access_token,
      },
      message: 'Autenticação funcionando corretamente!'
    })

  } catch (error) {
    console.error('Erro no endpoint de teste:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 