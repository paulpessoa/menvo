import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    console.log("🔐 Tentativa de login para:", email)

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
      .select("*")
      .eq("id", authData.user.id)
      .single()

    if (profileError) {
      console.error("⚠️ Erro ao buscar perfil:", profileError)
    }

    console.log("✅ Login bem-sucedido para:", authData.user.email)

    return NextResponse.json({
      success: true,
      message: "Login realizado com sucesso!",
      user: authData.user,
      profile: profile || null,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error("💥 Erro interno no login:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
