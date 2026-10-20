import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { createAppointmentSchema } from "@/lib/schemas/appointment"
import { buildAppointmentsService } from "@/lib/services/appointments/appointments.composition"
import { REQUEST_MESSAGES } from "../request-messages"

/**
 * Pede uma mentoria (formato `{ success, appointment }`, usado pelo BookingForm).
 *
 * Mesmo caso de uso de `/api/appointments/schedule`: a regra (check-in pendente,
 * mentor verificado, horário livre, token de 7 dias, e-mails) está em
 * `appointments.service.requestAppointment`. Aqui só se valida o corpo e se
 * escolhe o formato da resposta.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    // `message` é o nome que o BookingForm sempre enviou; aceitar como alias para
    // o motivo não ser descartado em silêncio.
    const parsed = createAppointmentSchema.safeParse({
      ...body,
      notes_mentee: body?.notes_mentee ?? body?.message
    })

    if (!parsed.success) {
      const errorMessage = parsed.error.issues[0]?.message || "Dados de agendamento inválidos"
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const { mentor_id, scheduled_at, duration_minutes, mentorship_topics, notes_mentee } = parsed.data

    const result = await buildAppointmentsService(supabase).requestAppointment({
      menteeId: user.id,
      menteeEmail: user.email,
      mentorId: mentor_id,
      scheduledAt: scheduled_at,
      durationMinutes: duration_minutes,
      topics: mentorship_topics,
      reason: notes_mentee
    })

    switch (result.kind) {
      case "pending_checkin":
        return NextResponse.json(
          {
            error: REQUEST_MESSAGES.pendingCheckin,
            code: "CONFLICT",
            details: { reason: "pending_checkin", ...result.checkin }
          },
          { status: 409 }
        )
      case "self_booking":
        return NextResponse.json({ error: REQUEST_MESSAGES.selfBooking, code: "FORBIDDEN" }, { status: 400 })
      case "mentor_not_found":
        return NextResponse.json({ error: REQUEST_MESSAGES.mentorNotFound, code: "NOT_FOUND" }, { status: 404 })
      case "mentor_not_verified":
        return NextResponse.json({ error: REQUEST_MESSAGES.mentorNotVerified, code: "FORBIDDEN" }, { status: 403 })
      case "slot_taken":
        return NextResponse.json({ error: REQUEST_MESSAGES.slotTaken, code: "CONFLICT" }, { status: 409 })
      case "ok": {
        // Sem `action_token`: é a credencial do mentor (quem tem o link confirma) e
        // o mentorado não precisa dele.
        const { action_token: _actionToken, mentor, mentee, ...appointment } = result.appointment
        return NextResponse.json(
          {
            success: true,
            appointment: {
              ...appointment,
              mentor: mentor && { full_name: mentor.full_name, avatar_url: mentor.avatar_url, email: mentor.email },
              mentee: mentee && { full_name: mentee.full_name, avatar_url: mentee.avatar_url, email: mentee.email }
            }
          },
          { status: 201 }
        )
      }
    }
  } catch (error) {
    console.error("❌ [CREATE APPOINTMENT] Erro inesperado:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
