import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/utils/supabase/server"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { z } from "zod"

const markCompletedSchema = z.object({
  appointmentId: z.union([z.string(), z.number()]).transform(val => String(val)),
})

/**
 * Endpoint para o MENTOR marcar explicitamente uma mentoria como concluída.
 * Isso não requer avaliação (o mentor não avalia o mentorado no fluxo atual).
 * Marcar como concluída sinaliza para o mentorado que a sessão terminou e libera o botão de avaliação para ele.
 */
export async function POST(request: NextRequest) {
  try {
    const serverSupabase = await createServerClient()
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = markCompletedSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "ID do agendamento inválido" },
        { status: 400 }
      )
    }
    const { appointmentId } = parsed.data

    const supabase = createServiceRoleClient()

    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("id, mentor_id, mentee_id, status")
      .eq("id", appointmentId)
      .single()

    if (fetchError || !appointment) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 })
    }

    if (appointment.mentor_id !== user.id) {
      return NextResponse.json(
        { error: "Apenas o mentor pode marcar esta sessão como concluída" },
        { status: 403 }
      )
    }

    if (appointment.status !== "confirmed") {
      return NextResponse.json(
        { error: "Só é possível concluir sessões confirmadas" },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", appointmentId)

    if (updateError) {
      console.error("[MARK COMPLETED] Erro ao concluir agendamento:", updateError)
      return NextResponse.json({ error: "Erro ao concluir agendamento" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[MARK COMPLETED] Erro inesperado:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
