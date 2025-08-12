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
    const { email, password, firstName, lastName } = body

    console.log("📝 Dados recebidos:", { email, firstName, lastName })

    // Validar entrada
    if (!email || !password || !firstName || !lastName) {
      console.error("❌ Campos obrigatórios faltando")
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
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
    const fullName = `${firstNameTrim} ${lastNameTrim}`

    console.log("🔄 Tentando registrar usuário no Supabase Auth...")

    // Registrar usuário no Supabase Auth usando admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: emailLower,
      password,
      email_confirm: false, // Requer confirmação por email
      user_metadata: {
        first_name: firstNameTrim,
        last_name: lastNameTrim,
        full_name: fullName,
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

    // Criar perfil na tabela profiles
    console.log("🔧 Criando perfil básico na tabela profiles...")

    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: authData.user.id,
      email: emailLower,
      first_name: firstNameTrim,
      last_name: lastNameTrim,
      full_name: fullName,
      user_role: "pending",
      verification_status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      console.error("❌ Erro ao criar perfil:", profileError)

      // Se falhar ao criar perfil, deletar usuário do auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)

      return NextResponse.json(
        {
          error: "Erro ao criar perfil do usuário",
          details: profileError.message,
        },
        { status: 500 },
      )
    }

    console.log("✅ Perfil criado com sucesso")

    // Enviar email de confirmação
    try {
      const { error: emailError } = await supabaseAdmin.auth.admin.generateLink({
        type: "signup",
        email: emailLower,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
        },
      })

      if (emailError) {
        console.error("⚠️ Erro ao enviar email de confirmação:", emailError)
        // Não falhar aqui, pois o usuário já foi criado
      } else {
        console.log("✅ Email de confirmação enviado")
      }
    } catch (emailError) {
      console.error("⚠️ Erro ao processar email de confirmação:", emailError)
    }

    console.log("🎉 Registro concluído com sucesso")

    return NextResponse.json({
      success: true,
      message: "Usuário registrado com sucesso! Verifique seu email para confirmar a conta.",
      user: {
        id: authData.user.id,
        email: authData.user.email,
        emailConfirmed: false,
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
