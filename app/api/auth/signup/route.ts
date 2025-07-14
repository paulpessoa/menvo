import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { z } from "zod"

const signupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  userType: z.enum(["mentee", "mentor", "volunteer"], {
    errorMap: () => ({ message: "Tipo de usuário inválido" }),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = signupSchema.parse(body)

    const { email, password, fullName, userType } = validatedData

    console.log("🔄 Iniciando signup:", { email, fullName, userType })

    const supabase = await createClient()

    // Verificar se email já existe
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json({ error: "Este email já está cadastrado" }, { status: 400 })
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          full_name: fullName,
          user_type: userType,
        },
      },
    })

    if (authError) {
      console.error("❌ Erro no signup:", authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Falha ao criar usuário" }, { status: 500 })
    }

    // Criar perfil na tabela profiles
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      email: email.toLowerCase(),
      full_name: fullName,
      role: "pending", // Sempre começa como pending
      status: "pending",
      verification_status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      console.error("❌ Erro ao criar perfil:", profileError)
      // Não retornamos erro aqui pois o usuário já foi criado
    }

    console.log("✅ Signup bem-sucedido:", authData.user.id)

    return NextResponse.json({
      success: true,
      message: "Conta criada com sucesso! Verifique seu email para confirmar.",
      user: {
        id: authData.user.id,
        email: authData.user.email,
        fullName,
        userType,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error("💥 Erro inesperado no signup:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
