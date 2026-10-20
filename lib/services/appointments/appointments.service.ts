/**
 * Camada 7 · Service (appointments, servidor)
 * Regra: casos de uso do ciclo da sessão (concluir, registrar ausência, ...) e a
 * permissão de cada um. Recebe repository e ports por parâmetro, então roda em
 * teste sem banco e sem e-mail. Toda mudança de status passa por
 * `assertTransition` (entity) e por `transitionStatus` (update condicional).
 * Não faz: HTTP (status, JSON, mensagens: camada 8), validar o corpo (camada 4)
 * nem falar com o banco (camada 5).
 * Tradeoff: cada operação devolve uma união (`kind`) em vez de lançar, para a rota
 * mapear para status sem `try/catch` por regra. Erro do banco que significa
 * "transição recusada" (trigger `appointments_guard_update`, P0001) também vira
 * `invalid_transition`: é o mesmo conflito visto pela última barreira. Qualquer
 * outro erro sobe como `RepositoryError` e a rota responde 500.
 * Ator: o service só conhece mentor/mentorado pelo `userId` e pela linha. O banco
 * não sabe qual usuário está atrás de uma rota `service_role`, então esta
 * checagem é a única que existe para elas.
 */
import type { Appointment, AppointmentListItem } from "@/lib/domain/appointments/appointment.entity"
import { participantRole } from "@/lib/domain/appointments/appointment.entity"
import {
  assertTransition,
  canTransition,
  InvalidTransitionError,
  type AppointmentStatus,
  type TransitionActor,
} from "@/lib/domain/appointments/appointment-status.entity"
import type { AppointmentCalendar } from "@/lib/ports/appointment-calendar"
import type { AppointmentMailer } from "@/lib/ports/appointment-mailer"
import type {
  AppointmentsRepository,
  ListForUserInput,
  TransitionPatch,
} from "@/lib/repositories/appointments.repository"
import type { AppointmentFeedbacksRepository } from "@/lib/repositories/appointment-feedbacks.repository"
import { RepositoryError } from "@/lib/repositories/repository-error"

export interface AppointmentsServiceDeps {
  repo: AppointmentsRepository
  feedbacks: AppointmentFeedbacksRepository
  mailer: AppointmentMailer
  calendar: AppointmentCalendar
  now?: () => Date
}

export interface EvaluationInput {
  rating: number
  privateNotes?: string | null
  publicFeedback?: string | null
}

/** A transição não aconteceu por motivo de regra, não de erro técnico. */
export type TransitionBlock = { kind: "changed" } | { kind: "invalid_transition"; message: string }

export type MarkCompletedResult =
  | { kind: "ok" }
  | { kind: "not_found" }
  | { kind: "forbidden" }
  | { kind: "wrong_status" }
  | TransitionBlock

export type NoShowResult =
  | { kind: "ok" }
  | { kind: "not_found" }
  | { kind: "forbidden" }
  | { kind: "in_future" }
  | { kind: "wrong_status" }
  | TransitionBlock

/**
 * `not_found` também cobre "existe, mas você não participa": responder 403
 * confirmaria a um desconhecido que o id é de uma sessão real.
 */
export type CancelResult =
  | { kind: "ok" }
  | { kind: "not_found" }
  | { kind: "already_cancelled" }
  /** Ex.: o mentorado tentando desfazer uma sessão que o mentor já concluiu. */
  | { kind: "forbidden" }
  | TransitionBlock

export type EvaluateResult =
  | { kind: "ok" }
  | { kind: "not_found" }
  | { kind: "forbidden" }
  | { kind: "wrong_status" }
  | { kind: "already_evaluated" }
  /** A sessão foi concluída, mas gravar a avaliação falhou; repetir o envio funciona. */
  | { kind: "feedback_failed" }
  | TransitionBlock

/** Mensagens do trigger de `20261020000000_appointments_status_guard.sql`. */
const GUARD_MESSAGE = /appointment_(invalid_transition|transition_forbidden|immutable_column)/

function isGuardRejection(error: unknown): error is RepositoryError {
  return error instanceof RepositoryError && GUARD_MESSAGE.test(error.message)
}

/**
 * Update condicional por status, com a recusa do banco convertida em resultado.
 * `from` é o status que acabamos de ler: se mudou no meio, ninguém casa e o
 * resultado é `changed` (o chamador pede para atualizar a tela).
 */
async function transition(
  repo: AppointmentsRepository,
  input: {
    appointment: Pick<Appointment, "id" | "status">
    to: AppointmentStatus
    actor: TransitionActor
    patch?: TransitionPatch
  }
): Promise<{ kind: "done"; appointment: Appointment } | TransitionBlock> {
  const { appointment, to, actor, patch } = input
  try {
    assertTransition(appointment.status, to, actor)
    const updated = await repo.transitionStatus({ id: appointment.id, from: appointment.status, to, patch })
    return updated ? { kind: "done", appointment: updated } : { kind: "changed" }
  } catch (error) {
    if (error instanceof InvalidTransitionError) return { kind: "invalid_transition", message: error.message }
    if (isGuardRejection(error)) return { kind: "invalid_transition", message: error.message }
    throw error
  }
}

export function createAppointmentsService(deps: AppointmentsServiceDeps) {
  const now = deps.now ?? (() => new Date())

  return {
    /**
     * O mentor conclui a sessão sem avaliação (o mentorado avalia depois).
     * Só `confirmed -> completed`; repetir o clique em uma sessão já concluída é `wrong_status`.
     */
    async markCompleted(appointmentId: string, userId: string): Promise<MarkCompletedResult> {
      const appointment = await deps.repo.findById(appointmentId)
      if (!appointment) return { kind: "not_found" }
      if (appointment.mentor_id !== userId) return { kind: "forbidden" }
      if (appointment.status !== "confirmed") return { kind: "wrong_status" }

      const result = await transition(deps.repo, {
        appointment,
        to: "completed",
        actor: "mentor",
        patch: { completed_at: now().toISOString() },
      })
      return result.kind === "done" ? { kind: "ok" } : result
    },

    /**
     * O mentor registra que o mentorado faltou: a sessão vira `cancelled` por
     * ausência, as avaliações dela são apagadas e o mentorado é avisado.
     * O aviso é `best effort`: falha de e-mail não desfaz o registro.
     */
    async registerNoShow(appointmentId: string, userId: string, notes?: string | null): Promise<NoShowResult> {
      const appointment = await deps.repo.findWithParties(appointmentId)
      if (!appointment) return { kind: "not_found" }
      if (appointment.mentor_id !== userId) return { kind: "forbidden" }
      if (new Date(appointment.scheduled_at).getTime() > now().getTime()) return { kind: "in_future" }
      if (appointment.status !== "confirmed" && appointment.status !== "completed") return { kind: "wrong_status" }

      const trimmedNotes = notes?.trim() || null
      const cancellationReason = trimmedNotes
        ? `Mentorado não compareceu: ${trimmedNotes}`
        : "Mentorado não compareceu à sessão"
      const nowIso = now().toISOString()

      const result = await transition(deps.repo, {
        appointment,
        to: "cancelled",
        actor: "mentor",
        patch: {
          cancellation_reason: cancellationReason,
          notes_mentor: trimmedNotes || "Mentorado não compareceu à sessão.",
          cancelled_at: nowIso,
          cancelled_by: userId,
          completed_at: null,
        },
      })
      if (result.kind !== "done") return result

      // Avaliação de uma sessão em que o mentorado faltou não faz sentido (e uma
      // prematura pode ter sido enviada antes). Se falhar, o registro vale mesmo assim.
      try {
        await deps.feedbacks.deleteByAppointment(appointmentId)
      } catch (error) {
        console.error("[appointments] não foi possível apagar avaliações do no-show:", (error as Error).message)
      }

      const { mentor, mentee } = appointment
      if (mentee?.email) {
        try {
          await deps.mailer.sendCancellation({
            recipientEmail: mentee.email,
            recipientName: mentee.full_name || "Mentorado",
            otherPersonName: mentor?.full_name || "Mentor",
            scheduledAt: appointment.scheduled_at,
            reason: cancellationReason,
            cancelledByName: mentor?.full_name || "Seu mentor",
          })
        } catch (error) {
          console.error("[appointments] erro ao avisar o mentorado do no-show:", (error as Error).message)
        }
      }

      return { kind: "ok" }
    },

    /**
     * Mentor ou mentorado cancela, com motivo. Remove o evento do calendário e
     * avisa a outra parte; as duas coisas são `best effort`.
     */
    async cancel(appointmentId: string, userId: string, reason: string): Promise<CancelResult> {
      const appointment = await deps.repo.findWithParties(appointmentId)
      if (!appointment) return { kind: "not_found" }

      const role = participantRole(appointment, userId)
      if (!role) return { kind: "not_found" }
      if (appointment.status === "cancelled") return { kind: "already_cancelled" }
      if (!canTransition(appointment.status, "cancelled", role)) return { kind: "forbidden" }

      const result = await transition(deps.repo, {
        appointment,
        to: "cancelled",
        actor: role,
        patch: { cancellation_reason: reason, cancelled_at: now().toISOString(), cancelled_by: userId },
      })
      if (result.kind !== "done") return result

      if (appointment.google_event_id) {
        try {
          await deps.calendar.deleteEvent(userId, appointment.google_event_id)
        } catch (error) {
          console.warn("[appointments] não foi possível remover o evento do calendário:", (error as Error).message)
        }
      }

      const { mentor, mentee } = appointment
      const isMentor = role === "mentor"
      const recipient = isMentor ? mentee : mentor
      if (recipient?.email) {
        try {
          await deps.mailer.sendCancellation({
            recipientEmail: recipient.email,
            recipientName: recipient.full_name || "Usuário Menvo",
            otherPersonName: isMentor ? mentor?.full_name || "Mentor" : mentee?.full_name || "Mentorado",
            scheduledAt: appointment.scheduled_at,
            reason,
            cancelledByName: isMentor ? mentor?.full_name || "Seu mentor" : mentee?.full_name || "Seu mentorado",
          })
        } catch (error) {
          console.error("[appointments] erro ao avisar o cancelamento:", (error as Error).message)
        }
      }

      return { kind: "ok" }
    },

    /**
     * O mentorado avalia o mentor e a sessão fica `completed`. Só o mentorado
     * avalia (assimetria de propósito, docs/STATUS.md "Mentorship Evaluation Model").
     * Ordem: primeiro o status, depois a avaliação. Se a avaliação falhar, a
     * pessoa repete o envio (sessão `completed` ainda é avaliável); na ordem
     * antiga, uma avaliação gravada com a sessão ainda `confirmed` travava o
     * reenvio com "já avaliada".
     */
    async evaluate(appointmentId: string, userId: string, input: EvaluationInput): Promise<EvaluateResult> {
      const appointment = await deps.repo.findById(appointmentId)
      if (!appointment) return { kind: "not_found" }
      if (appointment.mentee_id !== userId) return { kind: "forbidden" }
      if (appointment.status !== "confirmed" && appointment.status !== "completed") return { kind: "wrong_status" }
      if (await deps.feedbacks.findByReviewer(appointmentId, userId)) return { kind: "already_evaluated" }

      if (appointment.status === "confirmed") {
        const result = await transition(deps.repo, {
          appointment,
          to: "completed",
          actor: "mentee",
          patch: { completed_at: now().toISOString() },
        })
        if (result.kind !== "done") return result
      }

      try {
        await deps.feedbacks.insert({
          appointment_id: appointmentId,
          reviewer_id: userId,
          reviewed_id: appointment.mentor_id,
          rating: input.rating,
          private_notes: input.privateNotes || null,
          public_feedback: input.publicFeedback || null,
        })
      } catch (error) {
        console.error("[appointments] erro ao gravar a avaliação:", (error as Error).message)
        return { kind: "feedback_failed" }
      }

      return { kind: "ok" }
    },

    /** Sessões do usuário (como mentor, mentorado ou ambos), com a outra parte e as avaliações. */
    listMine(input: ListForUserInput): Promise<AppointmentListItem[]> {
      return deps.repo.listForUser(input)
    },
  }
}

export type AppointmentsService = ReturnType<typeof createAppointmentsService>
