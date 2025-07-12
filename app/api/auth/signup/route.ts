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

    console.log("📝 Dados de registro recebidos:", { email, firstName, lastName, userType })

    // Validações
    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    if (!firstName || !lastName) {
      return NextResponse.json({ error: "Nome e sobrenome são obrigatórios" }, { status: 400 })
    }

    if (!userType || !["mentee", "mentor"].includes(userType)) {
      return NextResponse.json({ error: "Tipo de usuário inválido" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Senha deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    const emailLower = email.toLowerCase().trim()
    const firstNameTrim = firstName.trim()
    const lastNameTrim = lastName.trim()
    const fullName = `${firstNameTrim} ${lastNameTrim}`.trim()

    console.log("🔄 Criando usuário no Supabase Auth...")

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: emailLower,
      password,
      email_confirm: false,
      user_metadata: {
        first_name: firstNameTrim,
        last_name: lastNameTrim,
        full_name: fullName,
        user_type: userType,
      },
    })

    if (authError) {
      console.error("❌ Erro no Supabase Auth:", authError)

      if (authError.message.includes("already registered")) {
        return NextResponse.json({ error: "Este email já está cadastrado" }, { status: 409 })
      }

      return NextResponse.json({ error: "Erro ao criar usuário", details: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Falha ao criar usuário" }, { status: 500 })
    }

    console.log("✅ Usuário criado:", authData.user.id)

    // Aguardar trigger processar
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Verificar se perfil foi criado
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, role, status")
      .eq("id", authData.user.id)
      .single()

    if (profileError) {
      console.error("⚠️ Perfil não foi criado pelo trigger:", profileError)

      // Criar perfil manualmente como fallback
      const { error: manualCreateError } = await supabaseAdmin.from("profiles").insert({
        id: authData.user.id,
        email: emailLower,
        first_name: firstNameTrim,
        last_name: lastNameTrim,
        full_name: fullName,
        role: userType,
        status: "pending",
        verification_status: "pending",
      })

      if (manualCreateError) {
        console.error("❌ Erro ao criar perfil manualmente:", manualCreateError)
      }
    } else {
      console.log("✅ Perfil criado:", profile)
    }

    // Enviar email de confirmação
    try {
      const { error: emailError } = await supabaseAdmin.auth.admin.generateLink({
        type: "signup",
        email: emailLower,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        },
      })

      if (emailError) {
        console.error("⚠️ Erro ao enviar email:", emailError)
      } else {
        console.log("✅ Email de confirmação enviado")
      }
    } catch (emailError) {
      console.error("⚠️ Erro no email:", emailError)
    }

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
    console.error("💥 Erro interno:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
