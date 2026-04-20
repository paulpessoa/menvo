import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const type = requestUrl.searchParams.get("type")
  const next = requestUrl.searchParams.get("next") || "/dashboard"
  
  // Detectar locale via cookie ou padrão pt-BR
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'pt-BR'

  console.log(`[AUTH CALLBACK] Iniciando troca de código. Code: ${!!code}, Locale: ${locale}`)

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // SUCESSO: O código foi trocado por uma sessão real
      console.log(`[AUTH CALLBACK] Troca bem-sucedida para o usuário: ${data.user.id}`)

      // 1. Verificar se o perfil e a role já existem (triggers do Supabase podem levar milissegundos)
      let roleName = null
      let attempts = 0
      
      while (!roleName && attempts < 3) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select(`roles (name)`)
          .eq("user_id", data.user.id)
          .single()
        
        roleName = (roleData?.roles as any)?.name
        if (!roleName) {
            console.log(`[AUTH CALLBACK] Role não encontrada, tentativa ${attempts + 1}...`)
            await new Promise(resolve => setTimeout(resolve, 500))
            attempts++
        }
      }

      // 2. Definir destino com base na role
      let targetPath = `/${locale}/dashboard`
      if (!roleName) targetPath = `/${locale}/select-role`
      else if (roleName === 'admin') targetPath = `/${locale}/admin`
      else if (roleName === 'mentor') targetPath = `/${locale}/dashboard/mentor`
      else if (roleName === 'mentee') targetPath = `/${locale}/dashboard/mentee`

      console.log(`[AUTH CALLBACK] Redirecionando para: ${targetPath}`)
      return NextResponse.redirect(new URL(targetPath, request.url))
    } else {
      console.error("[AUTH CALLBACK] Erro na troca de código:", error?.message)
    }
  }

  // Se chegou aqui sem sucesso ou sem código, volta para o login com erro limpo
  console.log("[AUTH CALLBACK] Falha total, voltando para o login.")
  return NextResponse.redirect(new URL(`/${locale}/login?error=auth_failed`, request.url))
}
