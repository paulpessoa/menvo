import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Cliente admin com service role key
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, userType } = body

    console.log("📝 Dados recebidos:", { email, firstName, lastName, userType })

    // Validar entrada
    if (!email || !password || !firstName || !lastName || !userType) {
      console.error("❌ Campos obrigatórios faltando")
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    // Validar userType
    if (!["mentor", "mentee"].includes(userType)) {
      return NextResponse.json({ error: "Tipo de usuário inválido" }, { status: 400 })
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }

    // Validar senha
    if (password.length < 6) {
      return NextResponse.json({ error: "Senha deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    const emailLower = email.toLowerCase().trim()
    const firstNameTrim = firstName.trim()
    const lastNameTrim = lastName.trim()
    const displayName = `${firstNameTrim} ${lastNameTrim}`

    console.log("🔄 Tentando registrar usuário no Supabase Auth...")

    // Usar signUp normal que envia automaticamente o email de confirmação
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email: emailLower,
      password,
      options: {
        data: {
          first_name: firstNameTrim,
          last_name: lastNameTrim,
          full_name: displayName,
          user_type: userType,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?type=signup`,
      },
    })

    if (authError) {
      console.error("❌ Erro no Supabase Auth:", authError)

      // Tratar erros específicos
      if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
        return NextResponse.json({ error: "Este email já está cadastrado" }, { status: 409 })
      }

      if (authError.message.includes("invalid email")) {
        return NextResponse.json({ error: "Email inválido" }, { status: 400 })
      }

      if (authError.message.includes("weak password")) {
        return NextResponse.json({ error: "Senha muito fraca. Use pelo menos 6 caracteres" }, { status: 400 })
      }

      return NextResponse.json({ error: "Erro ao registrar usuário", details: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      console.error("❌ Usuário não foi criado")
      return NextResponse.json({ error: "Falha ao criar usuário" }, { status: 500 })
    }

    console.log("✅ Usuário criado no Auth:", authData.user.id)

    console.log("✅ Perfil será criado automaticamente pelo trigger")

    console.log("✅ Validation request será criada automaticamente pelo trigger se necessário")
    console.log("✅ Email de confirmação será enviado automaticamente pelo Supabase")

    console.log("🎉 Registro concluído com sucesso")

    return NextResponse.json({
      success: true,
      message: "Usuário registrado com sucesso! Verifique seu email para confirmar a conta.",
      user: {
        id: authData.user.id,
        email: authData.user.email,
        emailConfirmed: false,
        role: userType,
      },
    })
  } catch (error) {
    console.error("💥 Erro interno no endpoint de registro:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
