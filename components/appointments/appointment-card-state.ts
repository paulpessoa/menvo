import type { AppointmentStatus } from "@/lib/domain/appointments/appointment-status.entity"
import type { Appointment, AppointmentParty } from "./appointment-card.types"

const UNKNOWN_PARTY: AppointmentParty = {
  id: "",
  full_name: "Usuário",
  email: "",
  linkedin_url: null
}

/**
 * Everything the card needs to decide what to show, derived in one pure place.
 *
 * Why separate: the status in the database does not know that time has passed
 * (a never-answered request stays "pending"), so the card derives the real state
 * here and the header/body/actions components only read flags.
 */
export function deriveAppointmentCardState(
  appointment: Appointment,
  currentUserId: string,
  isChatEnabled: boolean,
  now: Date = new Date()
) {
  const mentor = Array.isArray(appointment.mentor) ? appointment.mentor[0] : appointment.mentor
  const mentee = Array.isArray(appointment.mentee) ? appointment.mentee[0] : appointment.mentee

  const isMentor = mentor?.id === currentUserId
  const otherPerson: AppointmentParty = (isMentor ? mentee : mentor) || UNKNOWN_PARTY

  // Avaliação calculada diretamente dos dados da consulta mãe, sem query N+1
  const hasUserEvaluated = Boolean(
    appointment.feedbacks?.some((f) => f.reviewer_id === currentUserId)
  )

  const dateObj = new Date(appointment.scheduled_at)
  const isToday = dateObj.toDateString() === now.toDateString()
  const endTime = new Date(dateObj.getTime() + appointment.duration_minutes * 60 * 1000)
  const isPast = endTime < now

  // O status do banco não sabe que o tempo passou: um pedido nunca respondido
  // continua "pending" e uma sessão realizada continua "confirmed" até a
  // avaliação. O badge mostra o estado real para quem está olhando.
  const badgeStatus: AppointmentStatus | "expired" =
    isPast && appointment.status === "pending"
      ? "expired"
      : isPast && appointment.status === "confirmed"
        ? "completed"
        : appointment.status

  const canConfirm = isMentor && appointment.status === "pending" && !isPast
  const canCancel =
    (appointment.status === "pending" || appointment.status === "confirmed") && !isPast
  const canJoinMeet =
    appointment.status === "confirmed" && Boolean(appointment.google_meet_link) && !isPast
  const canChat = appointment.status === "pending" || appointment.status === "confirmed"
  const canComplete =
    !isMentor &&
    (appointment.status === "confirmed" || appointment.status === "completed") &&
    isPast &&
    !hasUserEvaluated
  const canMentorComplete = isMentor && appointment.status === "confirmed" && isPast
  const canReportNoShow =
    isMentor &&
    isPast &&
    (appointment.status === "confirmed" || appointment.status === "completed")

  const showChat = isChatEnabled && (canChat || canConfirm)
  const showLinkedin = !isChatEnabled && (canChat || canConfirm) && !!otherPerson.linkedin_url
  const hasActions =
    showChat ||
    showLinkedin ||
    canComplete ||
    canConfirm ||
    canCancel ||
    canJoinMeet ||
    canMentorComplete ||
    canReportNoShow

  return {
    isMentor,
    otherPerson,
    dateObj,
    isToday,
    badgeStatus,
    canConfirm,
    canCancel,
    canJoinMeet,
    canComplete,
    canMentorComplete,
    canReportNoShow,
    showChat,
    showLinkedin,
    hasActions
  }
}

/** Derived flags, as consumed by the card's sub-components. */
export type AppointmentCardState = ReturnType<typeof deriveAppointmentCardState>
