import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json({ error: "UserId e role são obrigatórios" }, { status: 400 })
    }

    if (!["mentee", "mentor", "volunteer"].includes(role)) {
      return NextResponse.json({ error: "Role inválida" }, { status: 400 })
    }

    console.log(`🔄 Atualizando role para ${role} do usuário: ${userId}`)

    // Atualizar role na tabela profiles
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        role: role,
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      console.error("❌ Erro ao atualizar role:", updateError)
      return NextResponse.json({ error: "Erro ao atualizar role" }, { status: 500 })
    }

    console.log("✅ Role atualizada com sucesso")

    // Buscar perfil atualizado
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, first_name, last_name, full_name, role, status, verification_status")
      .eq("id", userId)
      .single()

    if (profileError) {
      console.error("⚠️ Erro ao buscar perfil atualizado:", profileError)
    }

    return NextResponse.json({
      success: true,
      message: "Role atualizada com sucesso",
      profile: profile || null,
    })
  } catch (error) {
    console.error("💥 Erro interno:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
