/**
 * Camada 6 · Adapter Google Calendar (eventos de sessão)
 * Regra: implementa `AppointmentCalendar` com `google-calendar.service`.
 * Import dinâmico: a rota que não mexe em calendário não carrega `googleapis`.
 */
import type { AppointmentCalendar } from "../appointment-calendar"

export const googleAppointmentCalendar: AppointmentCalendar = {
  async deleteEvent(userId, eventId) {
    const { deleteCalendarEvent } = await import("@/lib/services/mentorship/google-calendar.service")
    await deleteCalendarEvent(userId, eventId)
  },
}
