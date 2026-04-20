import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const type = requestUrl.searchParams.get("type")
  const tokenHash = requestUrl.searchParams.get("token_hash")
  
  // Detectar idioma preferido via cookie ou padrão pt-BR
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'pt-BR'

  console.log(`[AUTH CALLBACK] Processing code: ${!!code}, type: ${type}, locale: ${locale}`)

  // 1. Handle Email Verifications / Recovery
  if (type && (tokenHash || code)) {
    try {
      const supabase = await createClient()
      let verifyResult: any
      
      if (tokenHash) {
        verifyResult = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any
        })
      } else if (code) {
        verifyResult = await supabase.auth.exchangeCodeForSession(code)
      }

      if (verifyResult?.error) throw verifyResult.error

      // Se for recuperação de senha, mandamos para o formulário de update
      const target = type === 'recovery' ? `/${locale}/update-password` : `/${locale}/dashboard`
      return NextResponse.redirect(new URL(target, request.url))
    } catch (error) {
      console.error(`[AUTH CALLBACK] Email error:`, error)
      return NextResponse.redirect(new URL(`/${locale}/login?error=auth_error`, request.url))
    }
  }

  // 2. Handle OAuth callback (Google/LinkedIn)
  if (code) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("[AUTH CALLBACK] OAuth exchange error:", error)
        // Tentativa de resgate PKCE via redirecionamento de cliente se falhar no servidor
        return NextResponse.redirect(new URL(`/${locale}/login?error=oauth_mismatch&code=${code}`, request.url))
      }

      if (data.user) {
        // Delay para garantir triggers de banco (profiles)
        await new Promise((resolve) => setTimeout(resolve, 800))

        const { data: roleData } = await supabase
          .from("user_roles")
          .select(`roles (name)`)
          .eq("user_id", data.user.id)
          .single()

        const roleName = (roleData?.roles as any)?.name

        let target = `/${locale}/dashboard`
        if (!roleName) target = `/${locale}/select-role`
        else if (roleName === 'admin') target = `/${locale}/admin`
        else if (roleName === 'mentor') target = `/${locale}/dashboard/mentor`
        else if (roleName === 'mentee') target = `/${locale}/dashboard/mentee`

        return NextResponse.redirect(new URL(target, request.url))
      }
    } catch (error) {
      console.error("[AUTH CALLBACK] Unexpected error:", error)
      return NextResponse.redirect(new URL(`/${locale}/login?error=callback_error`, request.url))
    }
  }

  // Fallback para login
  return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
}
