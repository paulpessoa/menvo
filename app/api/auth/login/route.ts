import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validações
    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    const supabase = await createClient()

    // Fazer login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    })

    if (authError) {
      console.error("❌ Erro no login:", authError.message)

      if (authError.message.includes("Invalid login credentials")) {
        return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 })
      }

      if (authError.message.includes("Email not confirmed")) {
        return NextResponse.json({ error: "Email não confirmado. Verifique sua caixa de entrada." }, { status: 401 })
      }

      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Falha no login" }, { status: 500 })
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, full_name, role, status, verification_status")
      .eq("id", authData.user.id)
      .single()

    if (profileError) {
      console.error("⚠️ Erro ao buscar perfil:", profileError)
    }

    return NextResponse.json({
      success: true,
      message: "Login realizado com sucesso!",
      user: authData.user,
      profile: profile || null,
    })
  } catch (error) {
    console.error("💥 Erro interno no login:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
