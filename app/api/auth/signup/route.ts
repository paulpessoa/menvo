import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
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
      return NextResponse.json({ error: "Dados obrigatórios não fornecidos" }, { status: 400 })
    }

    // Verificar se usuário já existe
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email)
    if (existingUser.user) {
      return NextResponse.json({ error: "Usuário já existe com este email" }, { status: 400 })
    }

    // Criar usuário
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      user_metadata: {
        full_name: fullName,
        user_type: userType,
        first_name: fullName.split(" ")[0] || "",
        last_name: fullName.split(" ").slice(1).join(" ") || "",
      },
      email_confirm: false, // Requer confirmação de email
    })

    if (error) {
      console.error("❌ Erro no signup:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log("✅ Usuário criado:", data.user?.id)

    // Verificar se o perfil foi criado pelo trigger
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", data.user!.id)
      .single()

    if (profileError || !profile) {
      console.log("⚠️ Perfil não encontrado, criando manualmente...")

      // Criar perfil manualmente se o trigger falhou
      const { error: insertError } = await supabaseAdmin.from("profiles").insert({
        id: data.user!.id,
        email: data.user!.email!,
        first_name: fullName.split(" ")[0] || "",
        last_name: fullName.split(" ").slice(1).join(" ") || "",
        full_name: fullName,
        role: "pending",
        status: "pending",
        verification_status: "pending",
      })

      if (insertError) {
        console.error("❌ Erro ao criar perfil:", insertError)
        return NextResponse.json({ error: "Erro ao criar perfil do usuário" }, { status: 500 })
      }
    }

    // Atualizar role se fornecida
    if (userType && userType !== "pending") {
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ role: userType })
        .eq("id", data.user!.id)

      if (updateError) {
        console.error("❌ Erro ao atualizar role:", updateError)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Usuário criado com sucesso. Verifique seu email para confirmar a conta.",
      user: {
        id: data.user!.id,
        email: data.user!.email,
        email_confirmed_at: data.user!.email_confirmed_at,
      },
    })
  } catch (error) {
    console.error("❌ Erro inesperado no signup:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
