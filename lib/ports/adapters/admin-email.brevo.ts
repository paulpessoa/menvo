/**
 * Camada 6 · Adapter Brevo (e-mails do painel admin)
 * Regra: implementa `AdminEmailPort` com os templates de `lib/email/brevo.ts`.
 * Import dinâmico: a rota que não envia e-mail não carrega o módulo.
 */
import type { AdminEmailPort } from "../admin-email"

export const brevoAdminEmail: AdminEmailPort = {
  async sendReengagementInvite(input) {
    const { sendReengagementInvite } = await import("@/lib/email/brevo")
    return sendReengagementInvite(input)
  },

  async renderReengagementPreview(input) {
    const { buildReengagementInviteHtml } = await import("@/lib/email/brevo")
    return buildReengagementInviteHtml(input)
  },

  async renderTemplatePreview(templateKey) {
    const { getEmailTemplatePreviewHtml } = await import("@/lib/email/brevo")
    return getEmailTemplatePreviewHtml(templateKey)
  },

  async sendTestEmail(input) {
    const { sendTestEmail } = await import("@/lib/email/brevo")
    return sendTestEmail(input)
  }
}
