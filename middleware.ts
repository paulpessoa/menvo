import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { Database } from "@/types/database"

type UserRole = Database["public"]["Enums"]["user_role"]

// Rotas públicas que não precisam de autenticação
const publicRoutes = [
  "/",
  "/about",
  "/how-it-works",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/unauthorized",
  "/confirmation",
  "/auth/callback",
  "/api/auth/google",
  "/api/auth/linkedin",
  "/api/auth/github",
]

// Mapeamento de rotas e permissões necessárias
const routePermissions: Record<string, string[]> = {
  "/admin": ["admin_system"],
  "/admin/users": ["admin_users"],
  "/admin/verifications": ["admin_verifications"],
  "/mentorship": ["provide_mentorship"],
  "/mentor-dashboard": ["provide_mentorship"],
  "/validate-activities": ["validate_activities"],
  "/moderate": ["moderate_content"],
}

export async function middleware(req: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // Refresh session if expired
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  const currentPath = req.nextUrl.pathname

  // Verificar se é rota pública
  const isPublicRoute = publicRoutes.some((route) => currentPath === route || currentPath.startsWith(route + "/"))

  // Se não há sessão e não é rota pública, redirecionar para login
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL("/login", req.url)
    redirectUrl.searchParams.set("redirect", currentPath)
    return NextResponse.redirect(redirectUrl)
  }

  // Se há sessão, verificar permissões
  if (session) {
    try {
      // Obter role do JWT (Custom Access Token Hook)
      const userRole = session.user.app_metadata?.user_role as UserRole

      // Verificar se precisa selecionar role
      if (userRole === "pending" && currentPath !== "/auth" && !isPublicRoute) {
        return NextResponse.redirect(new URL("/auth", req.url))
      }

      // Verificar permissões específicas da rota
      for (const [routePattern, requiredPermissions] of Object.entries(routePermissions)) {
        if (currentPath.startsWith(routePattern)) {
          // Buscar permissões da role no banco
          const { data: permissions } = await supabase
            .from("role_permissions")
            .select("permission")
            .eq("role", userRole)

          const userPermissions = permissions?.map((p) => p.permission) || []

          // Verificar se tem pelo menos uma das permissões necessárias
          const hasRequiredPermission = requiredPermissions.some((permission) =>
            userPermissions.includes(permission as any),
          )

          if (!hasRequiredPermission) {
            return NextResponse.redirect(new URL("/unauthorized", req.url))
          }
        }
      }
    } catch (error) {
      console.error("Erro no middleware:", error)
      // Em caso de erro, permitir acesso mas logar o erro
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
}
