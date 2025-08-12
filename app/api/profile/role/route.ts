import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { role } = await request.json()

    if (!role || !["mentor", "mentee"].includes(role)) {
      return NextResponse.json({ error: "Role inválida" }, { status: 400 })
    }

    const status = role === "mentor" ? "validation_pending" : "incomplete"

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        user_role: role,
        verification_status: status === "validation_pending" ? "pending" : "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Erro ao atualizar role:", updateError)
      return NextResponse.json({ error: "Erro ao salvar role" }, { status: 500 })
    }

    if (role === "mentor") {
      const { error: validationError } = await supabase.from("validation_requests").insert({
        user_id: user.id,
        request_type: "mentor_validation",
        status: "pending",
        created_at: new Date().toISOString(),
      })

      if (validationError) {
        console.error("Erro ao criar solicitação de validação:", validationError)
        // Não falhar aqui, apenas logar o erro
      }
    }

    return NextResponse.json({
      success: true,
      message: "Role atualizada com sucesso",
      role,
      status,
    })
  } catch (error) {
    console.error("Erro interno:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
