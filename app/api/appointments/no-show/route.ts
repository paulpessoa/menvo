import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/utils/supabase/server"
import { noShowAppointmentSchema } from "@/lib/schemas/appointment"
import { buildAppointmentsService } from "@/lib/services/appointments/appointments.composition"
import { RepositoryError } from "@/lib/repositories/repository-error"
import { transitionBlockedResponse } from "../transition-response"

/**
 * Endpoint para o MENTOR registrar a ausência do mentorado (no-show).
 *
 * Atualiza o status do agendamento para `cancelled` por ausência, salva as
 * anotações do mentor em `notes_mentor`, remove eventuais avaliações pendentes
 * ou prematuras do mentorado e envia notificação de cancelamento por ausência.
 *
 * Fino de propósito: auth -> Zod -> `appointments.service` -> status HTTP.
 */
export async function POST(request: NextRequest) {
  try {
    const serverSupabase = await createServerClient()
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = noShowAppointmentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Dados inválidos" },
        { status: 400 }
      )
    }
    const { appointmentId, notes } = parsed.data

    const result = await buildAppointmentsService(serverSupabase).registerNoShow(appointmentId, user.id, notes)
    switch (result.kind) {
      case "ok":
        return NextResponse.json({ success: true })
      case "not_found":
        return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 })
      case "forbidden":
        return NextResponse.json(
          { error: "Apenas o mentor pode registrar a ausência do mentorado" },
          { status: 403 }
        )
      case "in_future":
        return NextResponse.json(
          { error: "Só é possível registrar ausência após o horário agendado da sessão" },
          { status: 400 }
        )
      case "wrong_status":
        return NextResponse.json(
          { error: "Só é possível registrar ausência para sessões confirmadas ou concluídas" },
          { status: 400 }
        )
      default:
        return transitionBlockedResponse(result)
    }
  } catch (error) {
    console.error("[NO SHOW] Erro inesperado:", error)
    if (error instanceof RepositoryError) {
      return NextResponse.json({ error: "Erro ao atualizar agendamento" }, { status: 500 })
    }
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
