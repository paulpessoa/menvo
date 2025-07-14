import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Verificar se o usuário tem perfil
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single()

      // Se o perfil tem role pending, redireciona para welcome
      if (profile?.role === "pending") {
        return NextResponse.redirect(`${origin}/welcome`)
      }

      // Senão redireciona para dashboard ou próxima página
      const redirectUrl = next.startsWith("/") ? `${origin}${next}` : `${origin}/dashboard`
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Se houve erro, redireciona para login
  return NextResponse.redirect(`${origin}/login`)
}
