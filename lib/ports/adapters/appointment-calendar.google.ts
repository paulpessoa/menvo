/**
 * Camada 6 · Adapter Google Calendar (eventos de sessão)
 * Regra: implementa `AppointmentCalendar` com `google-calendar.service`.
 * Import dinâmico: a rota que não mexe em calendário não carrega `googleapis`.
 */
import type { AppointmentCalendar } from "../appointment-calendar"

export const googleAppointmentCalendar: AppointmentCalendar = {
  async availability() {
    const { isGoogleCalendarConfigured, getMissingEnvVars } = await import("@/lib/services/mentorship/google-calendar.service")
    return { configured: isGoogleCalendarConfigured(), missing: getMissingEnvVars() }
  },

  async createEvent(input) {
    const { createCalendarEvent } = await import("@/lib/services/mentorship/google-calendar.service")
    const created = await createCalendarEvent(input)
    return { eventId: created.eventId, meetLink: created.meetLink, calendarLink: created.calendarLink ?? null }
  },

  async deleteEvent(userId, eventId) {
    const { deleteCalendarEvent } = await import("@/lib/services/mentorship/google-calendar.service")
    await deleteCalendarEvent(userId, eventId)
  },
}
