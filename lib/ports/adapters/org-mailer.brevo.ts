/**
 * Camada 6 · Adapter Brevo (e-mails de organização)
 * Regra: implementa `OrgMailer` com os templates de `lib/email/brevo.ts`. Import
 * dinâmico: a rota que não envia e-mail não carrega o módulo. Falha de envio é
 * engolida de propósito (o e-mail é aviso, o pedido já foi gravado), como a
 * rota fazia com `.catch(() => null)`.
 */
import type { OrgMailer } from "../org-mailer"

export const brevoOrgMailer: OrgMailer = {
  async sendJoinRequest(notice) {
    const { sendOrgJoinRequestToAdmin } = await import("@/lib/email/brevo")
    await sendOrgJoinRequestToAdmin(notice).catch(() => null)
  },
}
