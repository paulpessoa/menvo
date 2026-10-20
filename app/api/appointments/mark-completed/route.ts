import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/utils/supabase/server"
import { markCompletedAppointmentSchema } from "@/lib/schemas/appointment"
import { buildAppointmentsService } from "@/lib/services/appointments/appointments.composition"
import { RepositoryError } from "@/lib/repositories/repository-error"
import { transitionBlockedResponse } from "../transition-response"

/**
 * Endpoint para o MENTOR marcar explicitamente uma mentoria como concluída.
 * Isso não requer avaliação (o mentor não avalia o mentorado no fluxo atual).
 * Marcar como concluída sinaliza para o mentorado que a sessão terminou e libera o botão de avaliação para ele.
 *
 * Fino de propósito: auth -> Zod -> `appointments.service` -> status HTTP. A
 * regra (só o mentor, só `confirmed -> completed`) está no service.
 */
export async function POST(request: NextRequest) {
  try {
    const serverSupabase = await createServerClient()
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = markCompletedAppointmentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "ID do agendamento inválido" }, { status: 400 })
    }

    const result = await buildAppointmentsService(serverSupabase).markCompleted(parsed.data.appointmentId, user.id)
    switch (result.kind) {
      case "ok":
        return NextResponse.json({ success: true })
      case "not_found":
        return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 })
      case "forbidden":
        return NextResponse.json(
          { error: "Apenas o mentor pode marcar esta sessão como concluída" },
          { status: 403 }
        )
      case "wrong_status":
        return NextResponse.json({ error: "Só é possível concluir sessões confirmadas" }, { status: 400 })
      default:
        return transitionBlockedResponse(result)
    }
  } catch (error) {
    console.error("[MARK COMPLETED] Erro inesperado:", error)
    if (error instanceof RepositoryError) {
      return NextResponse.json({ error: "Erro ao concluir agendamento" }, { status: 500 })
    }
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
