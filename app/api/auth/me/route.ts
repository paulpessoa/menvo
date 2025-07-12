import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Verificar usuário autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ user: null, profile: null }, { status: 200 })
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "id, email, first_name, last_name, full_name, role, status, verification_status, avatar_url, bio, location, created_at, updated_at",
      )
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("⚠️ Erro ao buscar perfil:", profileError)
      return NextResponse.json({
        user,
        profile: null,
      })
    }

    return NextResponse.json({
      user,
      profile,
    })
  } catch (error) {
    console.error("💥 Erro interno:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
