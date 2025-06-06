import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  
  if (authResult instanceof Response) {
    return authResult // Erro de autenticação
  }

  const { user, supabase } = authResult

  if (!user?.id) {
    return NextResponse.json(
      { error: 'ID do usuário não encontrado' },
      { status: 400 }
    )
  }

  try {
    // Buscar dados completos do usuário na tabela users
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()      

    if (error) {
      return NextResponse.json(
        { error: 'Usuário não encontrado na base de dados' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        ...userData,
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}