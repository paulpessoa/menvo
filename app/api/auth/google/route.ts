import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/api-utils'
import { signInWithOAuthProvider } from '@/lib/auth/oauth-provider-fixes'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const origin = request.headers.get('origin') || 'http://localhost:3000'
    
    const result = await signInWithOAuthProvider(supabase, 'google', {
      redirectTo: `${origin}/auth/callback`
    })

    if (result.error) {
      console.error('Google OAuth API error:', result.error)
      return NextResponse.json(
        { 
          error: result.error.message || 'Erro na autenticação com Google',
          details: result.error.details 
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      url: result.data.url,
      provider: 'google'
    })

  } catch (error: any) {
    console.error('Google OAuth API unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
