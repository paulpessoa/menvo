/**
 * Camada 6 · Adapter Brevo (e-mails do perfil)
 * Regra: implementa `ProfileMailer` com o layout compartilhado de
 * `lib/email/brevo.ts`.
 */
import type { ProfileMailer } from "../profile-mailer"
import { sendAdminNewMentorNotification } from "@/lib/email/brevo"

export const brevoProfileMailer: ProfileMailer = {
  notifyAdminNewMentor: (message) => sendAdminNewMentorNotification(message),
}
