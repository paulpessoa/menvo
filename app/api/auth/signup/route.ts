import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, userType } = await request.json()

    if (!email || !password || !fullName || !userType) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    const supabase = createClient()

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          user_type: userType,
        },
      },
    })

    if (authError) {
      console.error("Erro no signup:", authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Falha ao criar usuário" }, { status: 400 })
    }

    // Criar perfil na tabela profiles
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      email: email,
      full_name: fullName,
      role: userType,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      console.error("Erro ao criar perfil:", profileError)
      // Não retornamos erro aqui pois o usuário já foi criado
      // O perfil pode ser criado via trigger
    }

    return NextResponse.json({
      message: "Usuário criado com sucesso! Verifique seu email para confirmar a conta.",
      user: {
        id: authData.user.id,
        email: authData.user.email,
        fullName: fullName,
        userType: userType,
      },
    })
  } catch (error) {
    console.error("Erro inesperado no signup:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
