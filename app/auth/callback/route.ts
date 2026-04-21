import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

/**
 * Root callback route to handle redirects from Supabase that don't have a locale.
 * Redirects to the central API callback.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const type = searchParams.get("type")
  const next = searchParams.get("next") || "/dashboard"

  const locale = request.cookies.get("NEXT_LOCALE")?.value || "pt-BR"

  const targetPath =
    type === "recovery"
      ? `/${locale}/update-password`
      : `/${locale}${next.startsWith("/") ? next : "/" + next}`

  // Cria a response ANTES para poder setar cookies nela
  const redirectResponse = NextResponse.redirect(new URL(targetPath, origin))

  // Se houver código PKCE, precisamos trocar por sessão
  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Agora grava os cookies na response de verdade
            cookiesToSet.forEach(({ name, value, options }) =>
              redirectResponse.cookies.set(name, value, options)
            )
          }
        }
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(
        new URL(`/${locale}/login?error=auth_failed`, origin)
      )
    }
  }

  return redirectResponse
}
