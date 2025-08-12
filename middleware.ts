import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Apenas redirecionamentos básicos baseados em rotas
  const { pathname } = request.nextUrl

  // Se está tentando acessar páginas de auth e já tem cookie de sessão, redireciona
  const authRoutes = ["/login", "/signup", "/forgot-password"]
  const isAuthRoute = authRoutes.includes(pathname)

  // Verifica se tem cookie de sessão do Supabase (método simples)
  const hasSessionCookie =
    request.cookies.has("sb-access-token") ||
    request.cookies.has("supabase-auth-token") ||
    request.cookies.get("sb-localhost-auth-token")

  if (isAuthRoute && hasSessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
}
