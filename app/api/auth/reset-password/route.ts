import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { password, access_token, refresh_token } = await request.json()

    if (!password || !access_token || !refresh_token) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Senha deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    const supabase = await createClient()

    // Definir sessão com os tokens
    const { error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    })

    if (sessionError) {
      console.error("❌ Erro ao definir sessão:", sessionError)
      return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 401 })
    }

    // Atualizar senha
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      console.error("❌ Erro ao atualizar senha:", updateError)
      return NextResponse.json({ error: "Erro ao atualizar senha" }, { status: 500 })
    }

    console.log("✅ Senha atualizada com sucesso")

    return NextResponse.json({
      success: true,
      message: "Senha atualizada com sucesso!",
    })
  } catch (error) {
    console.error("💥 Erro interno:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
