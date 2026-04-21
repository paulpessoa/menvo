import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Obter usuário atual
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({
        user: null,
        profile: null,
        authenticated: false,
      })
    }

    // Buscar perfil
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("⚠️ Erro ao buscar perfil:", profileError)
    }

    return NextResponse.json({
      user,
      profile: profile || null,
      authenticated: true,
    })
  } catch (error) {
    console.error("💥 Erro interno:", error)
    return NextResponse.json({
      user: null,
      profile: null,
      authenticated: false,
    })
  }
}
