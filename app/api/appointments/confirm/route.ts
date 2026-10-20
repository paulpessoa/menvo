import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/utils/supabase/server"
import { confirmAppointmentSchema } from "@/lib/schemas/appointment"
import { buildAppointmentsService } from "@/lib/services/appointments/appointments.composition"
import { RepositoryError } from "@/lib/repositories/repository-error"
import { transitionBlockedResponse } from "../transition-response"

/**
 * O mentor confirma um pedido de mentoria.
 *
 * Dois caminhos, com credenciais diferentes (ADR 0008, E5):
 * - `token`: link do e-mail; o segredo aleatório é a credencial, não há sessão.
 * - `appointmentId`: botão do painel; exige sessão e que quem confirma seja o
 *   mentor da sessão. Sem isso, qualquer pessoa com o UUID confirmaria a sessão
 *   de outro mentor (evento no Google Calendar e e-mail incluídos).
 * A regra e a ordem (status, calendário, e-mail) estão em `appointments.service`.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = confirmAppointmentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { appointmentId, token, mentorNotes } = validation.data

    // O usuário da sessão só é lido no caminho sem token.
    const sessionClient = await createServerClient()
    let sessionUserId: string | null = null
    if (!token && appointmentId) {
      const { data: { user } } = await sessionClient.auth.getUser()
      sessionUserId = user?.id ?? null
    }

    const result = await buildAppointmentsService(sessionClient).confirm({ token, appointmentId, mentorNotes, sessionUserId })
    switch (result.kind) {
      case "ok":
        return NextResponse.json({
          success: true,
          googleEventId: result.googleEventId,
          googleMeetLink: result.googleMeetLink,
          calendarError: result.calendarError,
          message: result.googleEventId
            ? "Mentoria confirmada e evento criado no Google Calendar"
            : "Mentoria confirmada (evento do Calendar não foi criado)"
        })
      case "not_found":
        return NextResponse.json({ error: "Agendamento não encontrado ou token inválido" }, { status: 404 })
      case "forbidden":
        return NextResponse.json({ error: "Não autorizado a confirmar este agendamento" }, { status: 403 })
      case "already_confirmed":
        return NextResponse.json(
          { success: true, message: "Este agendamento já foi confirmado anteriormente!", alreadyConfirmed: true },
          { status: 200 }
        )
      case "wrong_status":
        return NextResponse.json({ error: `Este agendamento está com status: ${result.status}` }, { status: 400 })
      default:
        return transitionBlockedResponse(result)
    }
  } catch (error) {
    console.error("[CONFIRM] Erro inesperado:", error)
    if (error instanceof RepositoryError) {
      return NextResponse.json(
        { error: "Erro ao atualizar agendamento", details: error.message },
        { status: 500 }
      )
    }
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
