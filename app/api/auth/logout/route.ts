import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/api-utils'

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao fazer logout', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Logout realizado com sucesso' },
      { 
        status: 200,
        headers: {
          'Set-Cookie': 'supabase-auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax'
        }
      }
    )

  } catch (error) {
    console.error('Erro no endpoint de logout:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 