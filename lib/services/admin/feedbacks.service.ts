/**
 * Camada 7 · Service de moderação de avaliações (admin)
 * Regra: confere `is_admin()` com a sessão (`assertAdmin`) antes de ler ou
 * gravar. Aprovar avisa o mentor por e-mail (best-effort: falha de envio não
 * desfaz a moderação) e toda decisão deixa uma linha de auditoria.
 * Não faz: criar client nem montar resposta HTTP (rota e composition).
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import type {
  AdminFeedbacksRepository,
  ModeratedFeedbackRow
} from "@/lib/repositories/admin-ops.repository"
import type { FeedbackModerationBody } from "@/lib/schemas/admin"
import { assertAdmin } from "./assert-admin"

/** A avaliação pedida não existe (id errado ou já apagada). */
export class FeedbackNotFoundError extends Error {
  readonly status = 404
  constructor() {
    super("Feedback não encontrado")
    this.name = "FeedbackNotFoundError"
  }
}

export interface MentorReviewNotice {
  mentorEmail: string
  mentorName: string
  menteeName: string
  rating: number
  comment: string | null
}

export interface AdminFeedbacksDeps {
  /** Client da sessão de quem chama (nunca o `service_role`). */
  sessionDb: SupabaseClient<Database>
  repo: AdminFeedbacksRepository
  /** Port do e-mail ao mentor (adapter Brevo na composition). */
  notifyMentor: (notice: MentorReviewNotice) => Promise<void>
  /** Trilha de auditoria do admin (best-effort, nunca lança). */
  audit: (adminId: string, details: Record<string, unknown>, mentorId: string) => Promise<void>
}

/**
 * Cria o service de moderação de avaliações.
 *
 * @param deps sessão para o `assertAdmin`, repository, e-mail e auditoria.
 */
export function createAdminFeedbacksService(deps: AdminFeedbacksDeps) {
  return {
    /**
     * Avaliações pendentes de moderação.
     *
     * @throws {AdminForbiddenError} se quem chama não for admin.
     */
    async listPending() {
      await assertAdmin(deps.sessionDb)
      return deps.repo.listPending()
    },

    /**
     * Aprova ou rejeita uma avaliação; ao aprovar, avisa o mentor.
     *
     * @throws {AdminForbiddenError} se quem chama não for admin.
     * @throws {FeedbackNotFoundError} se o id não existe.
     */
    async moderate(adminId: string, input: FeedbackModerationBody): Promise<ModeratedFeedbackRow> {
      await assertAdmin(deps.sessionDb)
      const feedback = await deps.repo.moderate(
        input.feedbackId,
        input.status,
        input.rejectionReason || null
      )
      if (!feedback) throw new FeedbackNotFoundError()

      await deps.audit(
        adminId,
        {
          reason: "feedback_moderation",
          feedbackId: feedback.id,
          status: input.status,
          rejectionReason: input.rejectionReason || null
        },
        feedback.reviewed_id
      )

      if (input.status === "approved" && feedback.mentor?.email) {
        deps
          .notifyMentor({
            mentorEmail: feedback.mentor.email,
            mentorName: feedback.mentor.full_name || "Mentor",
            menteeName: feedback.mentee?.full_name || "Um aluno",
            rating: feedback.rating ?? 0,
            comment: feedback.public_feedback
          })
          .catch(err => console.error("[admin feedbacks] erro ao avisar o mentor:", err))
      }
      return feedback
    }
  }
}

export type AdminFeedbacksService = ReturnType<typeof createAdminFeedbacksService>
