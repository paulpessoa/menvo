import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Cliente admin
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    console.log("🔐 Tentativa de login para:", email)

    // Fazer login
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    })

    if (error) {
      console.error("❌ Erro no login:", error)

      if (error.message.includes("Invalid login credentials")) {
        return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
      }

      if (error.message.includes("Email not confirmed")) {
        return NextResponse.json({ error: "Por favor, confirme seu email antes de fazer login" }, { status: 401 })
      }

      return NextResponse.json({ error: "Erro no login" }, { status: 500 })
    }

    if (!data.user) {
      return NextResponse.json({ error: "Falha no login" }, { status: 500 })
    }

    console.log("✅ Login bem-sucedido para:", data.user.email)

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, first_name, last_name, full_name, role, status, verification_status")
      .eq("id", data.user.id)
      .single()

    if (profileError) {
      console.error("⚠️ Erro ao buscar perfil:", profileError)
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
      profile: profile || null,
    })
  } catch (error) {
    console.error("💥 Erro interno no login:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
