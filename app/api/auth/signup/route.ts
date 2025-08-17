import { createClient } from "@/utils/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, userType } = await request.json()

    // Validar dados obrigatórios
    if (!email || !password || !fullName || !userType) {
      return NextResponse.json({ error: "Email, password, fullName e userType são obrigatórios" }, { status: 400 })
    }

    const supabase = createClient()

    // Verificar se o usuário já existe
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", email.toLowerCase().trim())
      .single()

    if (existingUser) {
      return NextResponse.json({ error: "Usuário já existe com este email" }, { status: 400 })
    }

    // Criar usuário
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          full_name: fullName,
          user_type: userType,
          first_name: fullName.split(" ")[0] || "",
          last_name: fullName.split(" ").slice(1).join(" ") || "",
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=signup`,
      },
    })

    if (authError) {
      console.error("Erro na criação do usuário:", authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Falha ao criar usuário" }, { status: 400 })
    }

    // Fallback: criar perfil manualmente se o trigger não funcionou
    try {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: authData.user.id,
        email: email.toLowerCase().trim(),
        first_name: fullName.split(" ")[0] || "",
        last_name: fullName.split(" ").slice(1).join(" ") || "",
        full_name: fullName,
        role: "pending",
        status: "pending",
        verification_status: "pending",
      })

      if (profileError) {
        console.error("Erro ao criar perfil:", profileError)
      }
    } catch (profileError) {
      console.error("Erro no fallback do perfil:", profileError)
    }

    return NextResponse.json({
      message: "Usuário criado com sucesso. Verifique seu email para confirmar a conta.",
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    })
  } catch (error) {
    console.error("Erro inesperado no signup:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
