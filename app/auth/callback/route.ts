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
  
  // Obter locale do cookie ou default
  const locale = request.cookies.get('NEXT_LOCALE')?.value || 'pt-BR'

  console.log(`[ROOT CALLBACK] Flow: type=${type}, locale=${locale}, code=${!!code}`)

  // Se houver código PKCE, precisamos trocar por sessão
  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            // Handled automatically by Supabase SSR in request/response
          },
        },
      }
    )
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error("[ROOT CALLBACK] Exchange error:", error.message)
      return NextResponse.redirect(new URL(`/${locale}/login?error=auth_failed`, request.url))
    }
  }

  // Redirecionamento Prioritário: RECOVERY
  if (type === 'recovery' || request.url.includes('type=recovery')) {
    console.log(`[ROOT CALLBACK] Redirecting to localized update-password`)
    return NextResponse.redirect(new URL(`/${locale}/update-password`, origin))
  }

  // Redirecionamento Normal
  const targetPath = next.startsWith('/') ? next : `/${next}`
  return NextResponse.redirect(new URL(`/${locale}${targetPath}`, origin))
}
