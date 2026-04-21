import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const type = requestUrl.searchParams.get("type")
  const tokenHash = requestUrl.searchParams.get("token_hash")
  const next = requestUrl.searchParams.get("next") || "/dashboard"
  
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'pt-BR'

  console.log(`[AUTH CALLBACK] Processing: code=${!!code}, tokenHash=${!!tokenHash}, type=${type}, locale=${locale}`)

  const supabase = await createClient()

  // 1. Lógica para OTP/Token Hash (Verificação de Email via link direto)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as any,
    })
    
    if (error) {
      console.error("[AUTH CALLBACK] OTP Verification Error:", error.message)
      return NextResponse.redirect(new URL(`/${locale}/login?error=verification_failed`, request.url))
    }

    // Se verificou email de cadastro, manda para o confirmed
    if (type === 'signup' || type === 'invite') {
        return NextResponse.redirect(new URL(`/${locale}/confirmed`, request.url))
    }
    
    // Se for recovery via OTP hash
    if (type === 'recovery') {
        return NextResponse.redirect(new URL(`/${locale}/update-password`, request.url))
    }
  }

  // 2. Lógica para Code Exchange (PKCE)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // REDE DE SEGURANÇA: Às vezes o 'type' se perde no redirecionamento.
      // Verificamos se o fluxo originou de um recovery através da sessão.
      const isRecoveryFlow = type === 'recovery' || 
                             data.session?.user?.app_metadata?.recovery === true ||
                             request.url.includes('type=recovery')

      if (isRecoveryFlow) {
        console.log(`[AUTH CALLBACK] Recovery flow detected (type=${type}). Redirecting to update-password.`)
        return NextResponse.redirect(new URL(`/${locale}/update-password`, request.url))
      }

      // Se for confirmação de cadastro
      if (type === 'signup' || type === 'invite') {
        console.log(`[AUTH CALLBACK] Signup/Invite confirmation detected. Redirecting to confirmed page.`)
        return NextResponse.redirect(new URL(`/${locale}/confirmed`, request.url))
      }

      // Fluxo normal (Login/Signup)
      let roleName = null
      let attempts = 0
      
      while (!roleName && attempts < 2) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select(`roles (name)`)
          .eq("user_id", data.user.id)
          .single()
        
        roleName = (roleData?.roles as any)?.name
        if (!roleName) {
            await new Promise(resolve => setTimeout(resolve, 500))
            attempts++
        }
      }

      let targetPath = `/${locale}/dashboard`
      if (!roleName) targetPath = `/${locale}/select-role`
      else if (roleName === 'admin') targetPath = `/${locale}/admin`
      else if (roleName === 'mentor') targetPath = `/${locale}/dashboard/mentor`
      else if (roleName === 'mentee') targetPath = `/${locale}/dashboard/mentee`

      return NextResponse.redirect(new URL(targetPath, request.url))
    }
  }

  return NextResponse.redirect(new URL(`/${locale}/login?error=auth_failed`, request.url))
}
