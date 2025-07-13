import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, userType } = await request.json()

    console.log("🔄 Iniciando signup:", { email, fullName, userType })

    // Validar dados obrigatórios
    if (!email || !password || !fullName || !userType) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    // Verificar se o usuário já existe
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email)
    if (existingUser.user) {
      return NextResponse.json({ error: "Usuário já existe com este email" }, { status: 400 })
    }

    // Criar usuário
    const { data, error } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true, // Confirmar email automaticamente para desenvolvimento
      user_metadata: {
        full_name: fullName,
        first_name: fullName.split(" ")[0] || "",
        last_name: fullName.split(" ").slice(1).join(" ") || "",
        user_type: userType,
      },
    })

    if (error) {
      console.error("❌ Erro ao criar usuário:", error)
      return NextResponse.json({ error: error.message || "Erro ao criar usuário" }, { status: 400 })
    }

    if (!data.user) {
      return NextResponse.json({ error: "Falha ao criar usuário" }, { status: 500 })
    }

    console.log("✅ Usuário criado:", data.user.id)

    // Verificar se o perfil foi criado pelo trigger
    let profileCreated = false
    let attempts = 0
    const maxAttempts = 5

    while (!profileCreated && attempts < maxAttempts) {
      const { data: profile } = await supabase.from("profiles").select("id").eq("id", data.user.id).single()

      if (profile) {
        profileCreated = true
        console.log("✅ Perfil criado automaticamente pelo trigger")
      } else {
        attempts++
        await new Promise((resolve) => setTimeout(resolve, 500)) // Aguardar 500ms
      }
    }

    // Se o trigger não funcionou, criar perfil manualmente
    if (!profileCreated) {
      console.log("⚠️ Trigger não funcionou, criando perfil manualmente...")

      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email: email.toLowerCase().trim(),
        first_name: fullName.split(" ")[0] || "",
        last_name: fullName.split(" ").slice(1).join(" ") || "",
        role: userType,
        status: "pending",
        email_confirmed_at: new Date().toISOString(),
      })

      if (profileError) {
        console.error("❌ Erro ao criar perfil:", profileError)
        // Não falhar aqui, o perfil pode ser criado depois
      } else {
        console.log("✅ Perfil criado manualmente")
      }
    }

    return NextResponse.json({
      message: "Usuário criado com sucesso",
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    })
  } catch (error) {
    console.error("❌ Erro inesperado no signup:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
