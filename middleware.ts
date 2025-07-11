import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Rotas que precisam de autenticação
const protectedRoutes = ["/profile", "/dashboard", "/settings", "/admin"]

// Rotas que precisam de verificação
const verifiedRoutes = ["/mentorship", "/schedule"]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const currentPath = req.nextUrl.pathname

  // Verificar se precisa de autenticação
  const needsAuth = protectedRoutes.some((route) => currentPath.startsWith(route))

  if (needsAuth && !session) {
    const redirectUrl = new URL("/login", req.url)
    redirectUrl.searchParams.set("redirect", currentPath)
    return NextResponse.redirect(redirectUrl)
  }

  // Verificar se precisa de verificação
  const needsVerification = verifiedRoutes.some((route) => currentPath.startsWith(route))

  if (needsVerification && session) {
    // Buscar status de verificação
    const { data: profile } = await supabase
      .from("profiles")
      .select("verification_status")
      .eq("id", session.user.id)
      .single()

    if (profile?.verification_status !== "verified") {
      return NextResponse.redirect(new URL("/verification-pending", req.url))
    }
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
}
