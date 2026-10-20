import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"
import {
  MENTORSHIP_REASON_REQUIRED_MESSAGE,
  mentorshipReasonSchema
} from "@/lib/schemas/appointment"
import { buildAppointmentsService } from "@/lib/services/appointments/appointments.composition"
import { REQUEST_MESSAGES } from "../request-messages"

const DEFAULT_DURATION_MINUTES = 45

/**
 * Pede uma mentoria (formato `{ data, message }`, usado pelo BookMentorshipModal).
 *
 * Aceita snake_case e camelCase, e `requested_date` + hora (fuso -03:00) no lugar
 * de `scheduled_at`. A regra (check-in pendente, mentor verificado, horário
 * livre, token de 7 dias, e-mails) está em `appointments.service.requestAppointment`,
 * a mesma de `/api/appointments/create`.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401)
    }

    const body = await request.json()
    const {
      // snake_case (API-direct callers)
      mentor_id,
      scheduled_at,
      requested_date,
      requested_start_time,
      duration_minutes,
      mentorship_topics,
      notes_mentee,
      // camelCase (frontend BookMentorshipModal)
      mentorId,
      scheduledAt,
      requestedDate,
      requestedStartTime,
      duration,
      durationMinutes,
      message,
    } = body

    // Normalize: prefer snake_case if present, fall back to camelCase
    const resolvedMentorId = mentor_id ?? mentorId
    let resolvedScheduledAt = scheduled_at ?? scheduledAt

    const reqDate = requested_date ?? requestedDate
    const reqTime = requested_start_time ?? requestedStartTime

    if (!resolvedScheduledAt && reqDate && reqTime) {
      try {
        const timeFormatted = reqTime.length === 5 ? `${reqTime}:00` : reqTime
        resolvedScheduledAt = new Date(`${reqDate}T${timeFormatted}-03:00`).toISOString()
      } catch (err) {
        resolvedScheduledAt = `${reqDate}T${reqTime}`
      }
    }

    const resolvedDuration = Number(duration_minutes ?? durationMinutes ?? duration ?? DEFAULT_DURATION_MINUTES)
    const resolvedNotes = notes_mentee ?? message ?? ""
    const resolvedTopics: string[] = Array.isArray(mentorship_topics)
      ? mentorship_topics.filter((topic: unknown): topic is string => typeof topic === "string")
      : []

    if (!resolvedMentorId || !resolvedScheduledAt) {
      return errorResponse("Missing required fields", "VALIDATION_ERROR", 400)
    }

    if (!Number.isInteger(resolvedDuration) || resolvedDuration < 15 || resolvedDuration > 180) {
      return errorResponse("Duração inválida (de 15 a 180 minutos)", "VALIDATION_ERROR", 400)
    }

    // O motivo é obrigatório: é o único contexto que o mentor recebe sobre o pedido.
    const reasonCheck = mentorshipReasonSchema.safeParse(resolvedNotes)
    if (!reasonCheck.success) {
      return errorResponse(
        reasonCheck.error.issues[0]?.message || MENTORSHIP_REASON_REQUIRED_MESSAGE,
        "VALIDATION_ERROR",
        400
      )
    }

    const result = await buildAppointmentsService(supabase).requestAppointment({
      menteeId: user.id,
      menteeEmail: user.email,
      mentorId: resolvedMentorId,
      scheduledAt: resolvedScheduledAt,
      durationMinutes: resolvedDuration,
      topics: resolvedTopics,
      reason: reasonCheck.data
    })

    switch (result.kind) {
      case "pending_checkin":
        // O modal pergunta antes; isto garante a regra para qualquer cliente da API.
        return errorResponse(REQUEST_MESSAGES.pendingCheckin, "CONFLICT", 409, {
          reason: "pending_checkin",
          ...result.checkin
        })
      case "self_booking":
        return errorResponse(REQUEST_MESSAGES.selfBooking, "FORBIDDEN", 400)
      case "mentor_not_found":
        return errorResponse(REQUEST_MESSAGES.mentorNotFound, "NOT_FOUND", 404)
      case "mentor_not_verified":
        return errorResponse(REQUEST_MESSAGES.mentorNotVerified, "FORBIDDEN", 403)
      case "slot_taken":
        return errorResponse(REQUEST_MESSAGES.slotTaken, "CONFLICT", 409)
      case "ok": {
        // Sem `action_token`: é a credencial do mentor e não sai desta resposta.
        const { id, mentor_id: apptMentorId, mentee_id, scheduled_at: apptScheduledAt, duration_minutes: apptDuration, status, mentor, mentee } =
          result.appointment
        return successResponse(
          {
            id,
            mentor_id: apptMentorId,
            mentee_id,
            scheduled_at: apptScheduledAt,
            duration_minutes: apptDuration,
            status,
            mentor: mentor && { full_name: mentor.full_name, avatar_url: mentor.avatar_url },
            mentee: mentee && { full_name: mentee.full_name, avatar_url: mentee.avatar_url }
          },
          "Mentorship scheduled successfully"
        )
      }
    }
  } catch (error) {
    console.error("[schedule] Unexpected error:", error)
    return handleApiError(error)
  }
}
