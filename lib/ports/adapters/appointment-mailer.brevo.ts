/**
 * Camada 6 · Adapter Brevo (e-mails de agendamento)
 * Regra: implementa `AppointmentMailer` com os templates de `lib/email/brevo.ts`.
 * Import dinâmico: a rota que não envia e-mail não carrega o módulo.
 */
import type { AppointmentMailer } from "../appointment-mailer"

export const brevoAppointmentMailer: AppointmentMailer = {
  async sendRequest(message) {
    const { sendAppointmentRequest } = await import("@/lib/email/brevo")
    await sendAppointmentRequest(message)
  },

  async notifyAdminOfRequest(notice) {
    const { sendAdminNewAppointmentNotification } = await import("@/lib/email/brevo")
    const result = await sendAdminNewAppointmentNotification(notice)
    // O helper devolve `{ success: false }` em vez de lançar; o service só registra.
    if (result && result.success === false) throw new Error(result.error ?? "falha ao avisar o admin")
  },

  async sendCancellation(message) {
    const { sendAppointmentCancellation } = await import("@/lib/email/brevo")
    await sendAppointmentCancellation(message)
  },

  async sendConfirmation(message) {
    const { sendAppointmentConfirmation } = await import("@/lib/email/brevo")
    await sendAppointmentConfirmation(message)
  },
}
