import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, userType } = body

    console.log("📝 Dados recebidos:", { email, firstName, lastName, userType })

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

    const supabase = await createClient()

    console.log("🔄 Tentando registrar usuário no Supabase Auth...")

    // Registrar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          user_type: userType || "mentee",
        },
      },
    })

    if (authError) {
      console.error("❌ Erro no Supabase Auth:", authError)

      // Tratar erros específicos
      if (authError.message.includes("already registered")) {
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

    // Verificar se o perfil foi criado pelo trigger
    let profileCreated = false
    let retries = 0
    const maxRetries = 3

    while (!profileCreated && retries < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Aguardar 1 segundo

      const { data: existingProfile, error: profileCheckError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", authData.user.id)
        .single()

      if (existingProfile) {
        profileCreated = true
        console.log("✅ Perfil encontrado na tabela profiles")
      } else {
        retries++
        console.log(`⏳ Tentativa ${retries}/${maxRetries} - Perfil não encontrado ainda`)
      }
    }

    // Se o trigger não funcionou, criar perfil manualmente
    if (!profileCreated) {
      console.log("🔧 Criando perfil manualmente...")

      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        email: email.toLowerCase().trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        role: userType || "mentee",
        status: "pending",
        verification_status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        console.error("❌ Erro ao criar perfil:", profileError)
        // Não falhar aqui, pois o usuário já foi criado no Auth
      } else {
        console.log("✅ Perfil criado manualmente")
      }
    }

    console.log("🎉 Registro concluído com sucesso")

    return NextResponse.json({
      success: true,
      message: "Usuário registrado com sucesso! Verifique seu email para confirmar a conta.",
      user: {
        id: authData.user.id,
        email: authData.user.email,
        emailConfirmed: authData.user.email_confirmed_at ? true : false,
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
