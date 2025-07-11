import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Helper para extrair token do header Authorization
export function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

// Helper para criar cliente Supabase com token customizado
export function createSupabaseWithToken(token: string) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  )
}

// Middleware de autenticação
export async function requireAuth(request: NextRequest) {
  const token = getAuthToken(request)
  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Token de acesso necessário' }), 
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  const supabase = createSupabaseWithToken(token)
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return new Response(
      JSON.stringify({ error: 'Token inválido ou expirado' }), 
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  return { user, supabase }
}
