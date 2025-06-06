import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseServerClient()
    
    const { data, error } = await (await supabase).auth.signInWithPassword({
      email,
      password,
    })


    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
      accessToken: data.session?.access_token,  
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}