import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { z } from "zod"

const validateSchema = z.object({
  activity_id: z.string().uuid("ID da atividade inválido"),
  status: z.enum(["validated", "rejected"], {
    errorMap: () => ({ message: "Status deve ser validated ou rejected" }),
  }),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Verificar permissões
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || !["admin", "moderator"].includes(profile.role)) {
      return NextResponse.json({ error: "Sem permissão para validar atividades" }, { status: 403 })
    }

    const body = await request.json()
    const { activity_id, status, notes } = validateSchema.parse(body)

    // Atualizar atividade
    const { error: updateError } = await supabase
      .from("volunteer_activities")
      .update({
        status,
        validated_by: user.id,
        validated_at: new Date().toISOString(),
        validation_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activity_id)

    if (updateError) {
      console.error("Erro ao validar atividade:", updateError)
      return NextResponse.json({ error: "Erro ao validar atividade" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Atividade ${status === "validated" ? "validada" : "rejeitada"} com sucesso!`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error("Erro na validação:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
