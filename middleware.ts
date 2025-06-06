import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas públicas que não precisam de autenticação
const publicRoutes = [
  '/',
  '/about',
  '/how-it-works',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/confirmation',
  '/unauthorized',
  '/welcome',
  '/unsubscribe',
  '/auth/callback',
  '/api/auth/google',
  '/api/auth/linkedin',
  '/api/auth/github'
]

// Rotas que precisam de email confirmado
const emailConfirmationRequired = [
  '/mentorship',
  '/settings',
  '/calendar',
  '/messages',
  '/talents',
  '/talent',
  '/admin'
]

// Rotas que precisam de autenticação
const protectedRoutes = [
  '/profile',
  '/mentorship',
  '/settings',
  '/calendar',
  '/messages',
  '/talents',
  '/talent',
  '/admin'
]

export async function middleware(request: NextRequest) {
  try {
    // Criar cliente Supabase para o middleware
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })

    // Atualizar sessão se necessário
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Auth error:', error)
    }

    const path = request.nextUrl.pathname

    // Se for rota pública, permite acesso
    if (publicRoutes.some(route => path.startsWith(route))) {
      return res
    }

    // Se não estiver autenticado e tentar acessar rota protegida, redireciona para login
    if (!session && protectedRoutes.some(route => path.startsWith(route))) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', path)
      return NextResponse.redirect(redirectUrl)
    }

    // Verificar se email está confirmado para rotas que exigem confirmação
    if (emailConfirmationRequired.some(route => path.startsWith(route))) {
      if (!session?.user?.email_confirmed_at) {
        return NextResponse.redirect(new URL('/confirmation', request.url))
      }
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 