/**
 * Camada 6 · Adapter Brevo (e-mails de agendamento)
 * Regra: implementa `AppointmentMailer` com os templates de `lib/email/brevo.ts`.
 * Import dinâmico: a rota que não envia e-mail não carrega o módulo.
 */
import type { AppointmentMailer } from "../appointment-mailer"

export const brevoAppointmentMailer: AppointmentMailer = {
  async sendCancellation(message) {
    const { sendAppointmentCancellation } = await import("@/lib/email/brevo")
    await sendAppointmentCancellation(message)
  },
}
