/**
 * Camada 7 · Service (pedido para ser mentor)
 * Regra: ordem do caso de uso: RPC de verificação, textos da abordagem, aviso ao
 * admin. O e-mail nunca derruba o pedido (fire-and-forget, só loga).
 * Não faz: HTTP nem validação (a rota já passou o `RequestMentorInput`).
 * Tradeoff: em falha devolve `cause` com o erro CRU do driver, e não o do
 * repository, porque a rota o entrega ao `handleApiError`, cuja resposta 500
 * inclui a mensagem e os detalhes do erro. Embrulhar mudaria o corpo dessa
 * resposta; isso é a decisão D4 do Paul, não desta refatoração.
 */
import type { RequestMentorInput } from "@/lib/schemas/profile"
import type { MentorRequestRepository } from "@/lib/repositories/mentor-request.repository"
import { ProfileRepositoryError } from "@/lib/repositories/profile.repository"
import type { ProfileMailer } from "@/lib/ports/profile-mailer"

export interface MentorRequestServiceDeps {
  repo: Pick<MentorRequestRepository, "requestVerification" | "saveApproach">
  mailer: ProfileMailer
}

export interface MentorRequestUser {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}

export type MentorRequestOutcome =
  | { kind: "ok"; data: { id: string; is_pending_mentor: boolean; verification_status: string | null } }
  | { kind: "failed"; cause: unknown }

export function createMentorRequestService({ repo, mailer }: MentorRequestServiceDeps) {
  return {
    async submit(user: MentorRequestUser, input: RequestMentorInput): Promise<MentorRequestOutcome> {
      const { mentorship_approach: mentorshipApproach, what_to_expect: whatToExpect } = input

      let mentor
      try {
        await repo.requestVerification()
        mentor = await repo.saveApproach(user.id, {
          mentorship_approach: mentorshipApproach,
          what_to_expect: whatToExpect || null,
        })
      } catch (error) {
        return { kind: "failed", cause: error instanceof ProfileRepositoryError ? error.dbError : error }
      }

      const metadata = user.user_metadata ?? {}
      const userName =
        `${metadata.first_name || ""} ${metadata.last_name || ""}`.trim() || user.email || "Usuário"

      mailer
        .notifyAdminNewMentor({
          userName,
          userEmail: user.email || "",
          mentorshipApproach,
          whatToExpect: whatToExpect || undefined,
        })
        .catch((err) => console.error("[API] Error sending admin notification:", err))

      return {
        kind: "ok",
        data: {
          id: mentor.user_id,
          is_pending_mentor:
            mentor.verification_status === "pending" || mentor.verification_status === "changes_requested",
          verification_status: mentor.verification_status,
        },
      }
    },
  }
}

export type MentorRequestService = ReturnType<typeof createMentorRequestService>
