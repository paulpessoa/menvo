import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const type = requestUrl.searchParams.get("type")
  const next = requestUrl.searchParams.get("next") || "/dashboard"
  
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'pt-BR'

  console.log(`[AUTH CALLBACK] Type detected: ${type}, Locale: ${locale}`)

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Se o tipo for RECOVERY, mandamos OBRIGATORIAMENTE para a troca de senha
      if (type === 'recovery') {
        console.log(`[AUTH CALLBACK] Recovery flow detected. Redirecting to update-password.`)
        return NextResponse.redirect(new URL(`/${locale}/update-password`, request.url))
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
