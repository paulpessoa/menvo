import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Erro no login:", error)

      if (error.message.includes("Invalid login credentials")) {
        return NextResponse.json({ error: "E-mail ou senha inválidos" }, { status: 401 })
      }

      if (error.message.includes("Email not confirmed")) {
        return NextResponse.json({ error: "Por favor, confirme seu e-mail antes de fazer login" }, { status: 401 })
      }

      return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
    })
  } catch (error) {
    console.error("Erro no endpoint de login:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
