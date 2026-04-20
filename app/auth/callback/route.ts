import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const type = requestUrl.searchParams.get("type")
  const tokenHash = requestUrl.searchParams.get("token_hash")
  
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'pt-BR'
  
  console.log(`[AUTH DEBUG] Code present: ${!!code}, Type: ${type}, Locale: ${locale}`)

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
        console.error("❌ [AUTH CALLBACK] Server exchange failed, triggering Client Rescue:", error.message)
        
        // ESTRATÉGIA DE RESGATE FINAL: Se o servidor falhou (erro 4/0A), 
        // mandamos para o CLIENTE trocar o código. O navegador tem acesso 
        // garantido ao cookie de PKCE verifier que o servidor não conseguiu ler.
        return NextResponse.redirect(new URL(`/auth/callback/client-side?code=${code}`, request.url))
      }

      if (data.user) {
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
      return NextResponse.redirect(new URL(`/auth/callback/client-side?code=${code}`, request.url))
    }
  }

  return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
}
