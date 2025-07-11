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
  '/unauthorized',
  '/welcome',
  '/unsubscribe',
  '/confirmation',
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

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Se não há sessão, permitir acesso a rotas públicas
  if (!session) {
    // Rotas que requerem autenticação
    const protectedRoutes = ['/dashboard', '/profile', '/mentorship', '/settings']
    const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))
    
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    
    return res
  }

  // Se há sessão, verificar role no JWT
  if (session) {
    try {
      const currentPath = req.nextUrl.pathname
      const userRole = session.user.user_metadata?.role

      // Se usuário não tem role definida no JWT, permitir acesso
      // O AuthGuard vai mostrar o modal de seleção de role
      if (!userRole) {
        // Não redirecionar, deixar o AuthGuard lidar com isso
        return NextResponse.next()
      }

      // Verificar permissões baseadas na role do JWT
      if (userRole) {
        // Rotas que requerem role específica
        const adminRoutes = ['/admin']
        const mentorRoutes = ['/mentor-dashboard', '/mentor-sessions']
        
        const isAdminRoute = adminRoutes.some(route => currentPath.startsWith(route))
        const isMentorRoute = mentorRoutes.some(route => currentPath.startsWith(route))
        
        if (isAdminRoute && userRole !== 'admin') {
          return NextResponse.redirect(new URL('/unauthorized', req.url))
        }
        
        if (isMentorRoute && userRole !== 'mentor') {
          return NextResponse.redirect(new URL('/unauthorized', req.url))
        }
      }

    } catch (error) {
      console.error('Erro no middleware:', error)
      // Em caso de erro, permitir acesso
    }
  }

  return res
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