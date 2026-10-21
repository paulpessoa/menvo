/**
 * Camada 7 · Service dos convites de reengajamento (painel admin)
 * Regra: confere `is_admin()` com a sessão (`assertAdmin`) antes de pedir o
 * client privilegiado (lazy, vindo da composition) ou de renderizar qualquer
 * coisa. O e-mail sai pelo port `AdminEmailPort`; o token vem por função, para
 * o client privilegiado ser sempre o da composition.
 * Não faz: criar client nem montar resposta HTTP.
 * Tradeoff: cada pessoa do lote é independente (uma falha não aborta o lote).
 * Só mensagens de falha esperadas chegam ao admin; erro de banco vira texto
 * fixo e vai para o log do servidor.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import type { AdminEmailPort } from "@/lib/ports/admin-email"
import type { AdminInvitesRepository } from "@/lib/repositories/admin-ops.repository"
import type { InviteAudienceBody, InviteSendBody } from "@/lib/schemas/admin"
import type { ResolveAudienceResult } from "@/lib/services/invites/audience.service"
import { assertAdmin } from "./assert-admin"

/** Falha esperada de um envio, com texto que pode ir para o admin. */
class InviteSendError extends Error {}

export interface InviteSendResult {
  userId: string
  success: boolean
  error?: string
}

export interface AdminInvitesDeps {
  /** Client da sessão de quem chama (nunca o `service_role`). */
  sessionDb: SupabaseClient<Database>
  /** Lazy: o client privilegiado só nasce depois do `assertAdmin`. */
  repo: () => AdminInvitesRepository
  /** Resolve a audiência com o client privilegiado da composition. */
  audience: (params: InviteAudienceBody) => Promise<ResolveAudienceResult>
  /** Cria (ou rotaciona) o token do convite com o client privilegiado da composition. */
  createToken: (params: {
    userId: string
    campaign: string
    subject: string
    sentBy: string
    resend?: boolean
  }) => Promise<{ token: string }>
  mailer: AdminEmailPort
  /** Trilha do admin (`logAdminAction`); a composition amarra o request, se houver. */
  audit: (adminId: string, details: Record<string, unknown>) => Promise<void>
  /** Origem pública do app, para montar o link do convite. */
  appUrl: string
}

/**
 * Cria o service de convites do admin.
 *
 * @param deps sessão para o `assertAdmin` e as peças privilegiadas, todas lazy.
 */
export function createAdminInvitesService(deps: AdminInvitesDeps) {
  return {
    /**
     * Conta quem uma campanha alcançaria (ids e motivos de quem ficou de fora).
     *
     * @throws {AdminForbiddenError} se quem chama não for admin.
     */
    async resolveAudience(params: InviteAudienceBody): Promise<ResolveAudienceResult> {
      await assertAdmin(deps.sessionDb)
      return deps.audience(params)
    },

    /** HTML do convite com dados de exemplo, o mesmo que o envio real monta. */
    async previewInvite(bodyText: string): Promise<string> {
      await assertAdmin(deps.sessionDb)
      return deps.mailer.renderReengagementPreview({
        name: "Mariana Silva",
        bodyText,
        inviteUrl: `${deps.appUrl}/convite/preview-token`
      })
    },

    /**
     * Envia um lote. Devolve o resultado por pessoa e grava uma linha de
     * auditoria `bulk_action` com os totais.
     */
    async sendBatch(adminId: string, input: InviteSendBody) {
      await assertAdmin(deps.sessionDb)
      const { campaign, subject, body, userIds, resend } = input
      const repo = deps.repo()

      const profiles = new Map((await repo.findProfilesByIds(userIds)).map(p => [p.id, p]))
      const results: InviteSendResult[] = []

      for (const userId of userIds) {
        try {
          const profile = profiles.get(userId)
          if (!profile?.email) throw new InviteSendError("Perfil sem e-mail cadastrado")

          const { token } = await deps.createToken({ userId, campaign, subject, sentBy: adminId, resend })
          const sent = await deps.mailer.sendReengagementInvite({
            name: profile.full_name || profile.email,
            email: profile.email,
            subject,
            bodyText: body,
            inviteUrl: `${deps.appUrl}/convite/${token}`
          })
          if (!sent.success) throw new InviteSendError(sent.error || "Falha ao enviar e-mail")

          await repo.markInviteSent(userId)
          results.push({ userId, success: true })
        } catch (error) {
          if (!(error instanceof InviteSendError)) console.error("[admin invites] falha no envio:", error)
          results.push({
            userId,
            success: false,
            error: error instanceof InviteSendError ? error.message : "Erro ao enviar o convite"
          })
        }
      }

      const success = results.filter(r => r.success).length
      await deps.audit(adminId, {
        campaign,
        subject,
        count: userIds.length,
        success,
        failed: userIds.length - success
      })
      return { results, success, failed: userIds.length - success }
    }
  }
}

export type AdminInvitesService = ReturnType<typeof createAdminInvitesService>
