import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const type = requestUrl.searchParams.get("type")
  const tokenHash = requestUrl.searchParams.get("token_hash")
  
  // Detectar idioma preferido (padrão para pt-BR)
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'pt-BR'
  const origin = requestUrl.origin

  // 1. Handle Email Verifications/OTP
  if (type && (tokenHash || code)) {
    try {
      const supabase = await createClient()
      let verifyResult: any
      let redirectPath = `/${locale}/dashboard`

      if (tokenHash) {
        verifyResult = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any
        })
      } else if (code) {
        verifyResult = await supabase.auth.exchangeCodeForSession(code)
      }

      if (verifyResult.error) throw verifyResult.error

      return NextResponse.redirect(new URL(redirectPath, request.url))
    } catch (error) {
      console.error(`Email callback error:`, error)
      return NextResponse.redirect(new URL(`/${locale}/login?error=auth_error`, request.url))
    }
  }

  // 2. Handle OAuth callback (Google/LinkedIn)
  if (code) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("❌ Error exchanging code for session:", error)
        return NextResponse.redirect(new URL(`/${locale}/login?error=oauth_error`, request.url))
      }

      if (data.user) {
        // Aguarda o trigger de perfil
        await new Promise((resolve) => setTimeout(resolve, 800))

        const { data: roleData } = await supabase
          .from("user_roles")
          .select(`roles (name)`)
          .eq("user_id", data.user.id)
          .single()

        const roleName = (roleData?.roles as any)?.name

        // Se não tiver papel, vai para seleção de papel
        if (!roleName) {
          return NextResponse.redirect(new URL(`/${locale}/select-role`, request.url))
        }

        // Lógica de redirecionamento por papel
        let target = `/${locale}/dashboard/mentee`
        if (roleName === 'admin') target = `/${locale}/admin`
        if (roleName === 'mentor') target = `/${locale}/dashboard/mentor`

        return NextResponse.redirect(new URL(target, request.url))
      }
    } catch (error) {
      console.error("OAuth callback error:", error)
      return NextResponse.redirect(new URL(`/${locale}/login?error=callback_error`, request.url))
    }
  }

  // Fallback para login
  return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
}
