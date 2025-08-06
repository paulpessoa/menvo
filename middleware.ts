import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: "",
            ...options,
          })
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Rotas que requerem autenticação
  const protectedRoutes = ["/dashboard", "/profile", "/settings", "/onboarding", "/mentors/[id]"]
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route.replace("[id]", "")),
  )

  // Rotas que requerem validação (is_validated = true)
  const validatedRoutes = ["/dashboard/mentor", "/mentors/[id]/schedule"]
  const isValidatedRoute = validatedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route.replace("[id]", "")),
  )

  // Redirecionar para login se não autenticado em rota protegida
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Se usuário autenticado, verificar se precisa fazer onboarding
  if (user && isProtectedRoute && request.nextUrl.pathname !== "/onboarding") {
    try {
      // Verificar se usuário tem perfil
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, role, is_validated")
        .eq("user_id", user.id)
        .single()

      // Se não tem perfil, redirecionar para onboarding
      if (!profile) {
        return NextResponse.redirect(new URL("/onboarding", request.url))
      }

      // Validação de permissões para rotas específicas como solicitado no prompt
      if (isValidatedRoute) {
        // Verificar se usuário está validado (is_validated = true)
        if (!profile.is_validated) {
          const redirectUrl = new URL("/dashboard", request.url)
          redirectUrl.searchParams.set("error", "profile_not_validated")
          return NextResponse.redirect(redirectUrl)
        }

        // Verificar role específica para rotas de mentor
        if (request.nextUrl.pathname.startsWith("/dashboard/mentor") && profile.role !== "mentor") {
          return NextResponse.redirect(new URL("/dashboard", request.url))
        }
      }

    } catch (error) {
      console.error("Erro no middleware:", error)
      // Em caso de erro, redirecionar para onboarding por segurança
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }
  }

  // Redirecionar usuários autenticados das páginas de auth
  const authRoutes = ["/login", "/signup", "/forgot-password"]
  const isAuthRoute = authRoutes.includes(request.nextUrl.pathname)

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
