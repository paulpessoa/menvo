import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, userType } = body

    // Validar entrada
    if (!email || !password || !firstName || !lastName || !userType) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    // Validar userType
    if (!["mentor", "mentee"].includes(userType)) {
      return NextResponse.json({ error: "Tipo de usuário inválido" }, { status: 400 })
    }

    const emailLower = email.toLowerCase().trim()
    const firstNameTrim = firstName.trim()
    const lastNameTrim = lastName.trim()
    const displayName = `${firstNameTrim} ${lastNameTrim}`

    const supabase = await createClient()

    // Usar signUp normal que envia automaticamente o email de confirmação
    const { data: authData, error: authError } = await supabase.auth.signUp({
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
      // Tratar erros específicos
      if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
        return NextResponse.json({ error: "Este email já está cadastrado" }, { status: 409 })
      }

      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Falha ao criar usuário" }, { status: 500 })
    }

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
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
