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
import type {
  Appointment,
  AppointmentListItem,
  AppointmentWithParties,
} from "@/lib/domain/appointments/appointment.entity"
import { actionTokenExpiry, isActionTokenExpired, participantRole } from "@/lib/domain/appointments/appointment.entity"
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
import type {
  AppointmentFeedbacksRepository,
  FeedbackListItem,
} from "@/lib/repositories/appointment-feedbacks.repository"
import type { AppointmentMentorRepository } from "@/lib/repositories/appointment-mentor.repository"
import { RepositoryError } from "@/lib/repositories/repository-error"
import type { PendingCheckin } from "./checkin-responses.service"
import { randomBytes } from "crypto"

export interface AppointmentsServiceDeps {
  /** Client da SESSÃO do usuário (RLS + trigger). Usado onde o ADR 0008 §4 tirou o `service_role`. */
  repo: AppointmentsRepository
  feedbacks: AppointmentFeedbacksRepository
  /**
   * Repositories com `service_role`, criados só quando pedidos (o build roda sem
   * segredos). Quem chama precisa já ter conferido o ator (ADR 0008 §2.3).
   * Exceções: E3 contato da outra parte, E5 token do e-mail, leituras de lista
   * com embed de `profiles`, e apagar avaliações no no-show.
   */
  admin: () => { repo: AppointmentsRepository; feedbacks: AppointmentFeedbacksRepository }
  /** Mentor alvo do pedido (existe? verificado? e-mail). Também com a sessão do mentorado. */
  mentors: AppointmentMentorRepository
  /** Sessão passada do mentorado sem resposta ao "aconteceu?", que bloqueia um pedido novo. */
  pendingCheckin: (menteeId: string) => Promise<PendingCheckin | null>
  mailer: AppointmentMailer
  calendar: AppointmentCalendar
  now?: () => Date
}

/** Pedido já normalizado pela rota (camelCase e snake_case viram isto antes de chegar aqui). */
export interface RequestAppointmentInput {
  menteeId: string
  /** Só para o nome do mentorado no e-mail quando o perfil dele não tem `full_name`. */
  menteeEmail?: string | null
  mentorId: string
  scheduledAt: string
  durationMinutes: number
  topics: string[]
  /** Motivo já validado (`mentorshipReasonSchema`): é o contexto que o mentor recebe. */
  reason: string
}

export type RequestAppointmentResult =
  | { kind: "ok"; appointment: AppointmentWithParties }
  /** A última mentoria do mentorado ainda não teve o "aconteceu?" respondido. */
  | { kind: "pending_checkin"; checkin: PendingCheckin }
  | { kind: "self_booking" }
  | { kind: "mentor_not_found" }
  | { kind: "mentor_not_verified" }
  | { kind: "slot_taken" }

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

export interface ConfirmInput {
  /** Link do e-mail do mentor. Quando vem, é a credencial e `sessionUserId` não conta. */
  token?: string
  /** Botão do painel. Exige `sessionUserId` igual ao mentor da sessão. */
  appointmentId?: string
  mentorNotes?: string
  sessionUserId: string | null
}

export type ConfirmResult =
  | { kind: "ok"; googleEventId: string | null; googleMeetLink: string | null; calendarError: string | null }
  | { kind: "not_found" }
  | { kind: "forbidden" }
  | { kind: "already_confirmed" }
  | { kind: "wrong_status"; status: AppointmentStatus }
  /** O link do e-mail passou da validade (7 dias). O botão do painel continua valendo. */
  | { kind: "token_expired" }
  | TransitionBlock

export type UpdateFeedbackResult = { kind: "ok" } | { kind: "not_found" } | { kind: "forbidden" }

/** Texto do convite do calendário; o mentor lê isto no evento. */
function buildEventDescription(appointment: AppointmentWithParties, mentorNotes?: string): string {
  let description = "Sessão de mentoria confirmada através da plataforma MENVO.\n\n"
  description += `👤 Mentor: ${appointment.mentor?.full_name ?? ""}\n`
  description += `👤 Mentee: ${appointment.mentee?.full_name ?? ""}\n`
  description += `⏱️ Duração: ${appointment.duration_minutes} minutos\n\n`
  if (appointment.notes_mentee) description += `📝 Mensagem do mentee:\n${appointment.notes_mentee}\n\n`
  if (mentorNotes) description += `💬 Observações do mentor:\n${mentorNotes}\n\n`
  description += "---\n"
  description += "Plataforma: MENVO - Mentores Voluntários\n"
  description += "🔗 Link do Meet será gerado automaticamente"
  return description
}

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
     * O mentorado pede uma mentoria: nasce `pending`, com um link de confirmação
     * que vale 7 dias, e o mentor (e a equipe) são avisados. É o único caminho de
     * criação; `POST /api/appointments/schedule` e `/create` só normalizam a entrada.
     * Ordem das regras: check-in pendente, auto-agendamento, mentor existe, mentor
     * verificado, horário livre, insert. O conflito é checado só contra o início
     * exato (pendente ou confirmado); duas requests no mesmo segundo ainda passam
     * juntas até existir o índice único (docs/blueprint/appointments-audit.md, item 7).
     * Tudo roda com a sessão do mentorado (RLS); nenhum `service_role`.
     * Os e-mails são `best effort` e ficam depois do insert: falha de envio não
     * desfaz o pedido, e a equipe é avisada mesmo se o mentor não tiver e-mail.
     */
    async requestAppointment(input: RequestAppointmentInput): Promise<RequestAppointmentResult> {
      const { menteeId, mentorId, scheduledAt } = input

      const checkin = await deps.pendingCheckin(menteeId)
      if (checkin) return { kind: "pending_checkin", checkin }

      if (mentorId === menteeId) return { kind: "self_booking" }

      const mentor = await deps.mentors.findRequestable(mentorId)
      if (!mentor) return { kind: "mentor_not_found" }
      if (!mentor.verified) return { kind: "mentor_not_verified" }

      if (await deps.repo.hasSlotConflict(mentorId, scheduledAt)) return { kind: "slot_taken" }

      const actionToken = randomBytes(32).toString("hex")
      const appointment = await deps.repo.insertPending({
        mentor_id: mentorId,
        mentee_id: menteeId,
        scheduled_at: scheduledAt,
        duration_minutes: input.durationMinutes,
        topic: input.topics.join(", "),
        notes_mentee: input.reason,
        message: input.reason,
        action_token: actionToken,
        token_expires_at: actionTokenExpiry(now()),
      })

      const menteeName = appointment.mentee?.full_name || input.menteeEmail || "Mentee"
      if (mentor.email) {
        try {
          await deps.mailer.sendRequest({
            mentorEmail: mentor.email,
            mentorName: mentor.full_name || "Mentor",
            menteeName,
            scheduledAt,
            message: input.reason,
            token: actionToken,
          })
        } catch (error) {
          console.error("[appointments] erro ao avisar o mentor do pedido:", (error as Error).message)
        }
      } else {
        console.warn("[appointments] mentor sem e-mail cadastrado, aviso do pedido não enviado:", mentorId)
      }

      try {
        await deps.mailer.notifyAdminOfRequest({
          mentorName: mentor.full_name || "Mentor",
          mentorEmail: mentor.email ?? "",
          menteeName,
          menteeEmail: appointment.mentee?.email ?? input.menteeEmail ?? "",
          scheduledAt,
          notes: input.reason,
        })
      } catch (error) {
        console.error("[appointments] erro ao avisar a equipe do pedido:", (error as Error).message)
      }

      return { kind: "ok", appointment }
    },

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
      // Privilegiado de ponta a ponta (ADR 0008): lê o e-mail do mentorado (E3) e
      // apaga avaliações, que o mentor não tem policy para apagar.
      const { repo, feedbacks } = deps.admin()
      const appointment = await repo.findWithParties(appointmentId)
      if (!appointment) return { kind: "not_found" }
      if (appointment.mentor_id !== userId) return { kind: "forbidden" }
      if (new Date(appointment.scheduled_at).getTime() > now().getTime()) return { kind: "in_future" }
      if (appointment.status !== "confirmed" && appointment.status !== "completed") return { kind: "wrong_status" }

      const trimmedNotes = notes?.trim() || null
      const cancellationReason = trimmedNotes
        ? `Mentorado não compareceu: ${trimmedNotes}`
        : "Mentorado não compareceu à sessão"
      const nowIso = now().toISOString()

      const result = await transition(repo, {
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
        await feedbacks.deleteByAppointment(appointmentId)
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
      // A leitura é privilegiada só pelo contato da outra parte (E3). Como ela
      // enxerga qualquer sessão, o participante é conferido antes de qualquer efeito.
      const appointment = await deps.admin().repo.findWithParties(appointmentId)
      if (!appointment) return { kind: "not_found" }

      const role = participantRole(appointment, userId)
      if (!role) return { kind: "not_found" }
      if (appointment.status === "cancelled") return { kind: "already_cancelled" }
      if (!canTransition(appointment.status, "cancelled", role)) return { kind: "forbidden" }

      // A escrita volta para a sessão do usuário (ADR 0008 §4): RLS de UPDATE do
      // participante + trigger `appointments_guard_update` como segunda barreira.
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
      return deps.admin().repo.listForUser(input)
    },

    /**
     * O mentor confirma um pedido `pending`: pelo link do e-mail (o token é a
     * credencial, ADR 0008 E5) ou pelo botão do painel (`sessionUserId` tem de ser
     * o mentor da sessão).
     * Ordem: primeiro o status (update condicional, então cron e confirmação não
     * se atropelam), depois o evento do calendário, depois o e-mail. Antes o evento
     * era criado antes do update e ficava órfão se o update falhasse. Calendário e
     * e-mail são `best effort`: a sessão fica confirmada mesmo sem eles, e o aviso
     * `calendarError` diz ao mentor o que faltou.
     * O token vence em `token_expires_at` (D4): link vencido é `token_expired`,
     * só para quem veio pelo link e só enquanto o pedido está `pending`; quem
     * já confirmou ou foi cancelado recebe a resposta de sempre. Nulo = não vence.
     */
    async confirm(input: ConfirmInput): Promise<ConfirmResult> {
      const { token, appointmentId, mentorNotes, sessionUserId } = input
      // Privilegiado (ADR 0008 E3 e E5): quem clica no e-mail não tem sessão, e o
      // e-mail das duas partes vem do perfil.
      const { repo } = deps.admin()
      const appointment = token
        ? await repo.findWithPartiesByActionToken(token)
        : appointmentId
          ? await repo.findWithParties(appointmentId)
          : null
      if (!appointment) return { kind: "not_found" }

      // Sem token, o botão do painel não carrega segredo: só o mentor da sessão confirma.
      if (!token && sessionUserId !== appointment.mentor_id) return { kind: "forbidden" }

      if (appointment.status === "confirmed") return { kind: "already_confirmed" }
      if (appointment.status !== "pending") return { kind: "wrong_status", status: appointment.status }
      if (token && isActionTokenExpired(appointment, now())) return { kind: "token_expired" }

      const result = await transition(repo, {
        appointment,
        to: "confirmed",
        actor: "mentor",
        patch: mentorNotes ? { notes_mentor: mentorNotes } : undefined,
      })
      if (result.kind !== "done") return result

      const { mentor, mentee } = appointment
      let googleEventId: string | null = null
      let googleMeetLink: string | null = null
      let calendarLink: string | null = null
      let calendarError: string | null = null

      const availability = await deps.calendar.availability()
      if (availability.configured) {
        try {
          const start = new Date(appointment.scheduled_at)
          const created = await deps.calendar.createEvent({
            summary: `Mentoria: ${mentor?.full_name ?? "Mentor"} & ${mentee?.full_name ?? "Mentorado"}`,
            description: buildEventDescription(appointment, mentorNotes),
            startTime: start,
            endTime: new Date(start.getTime() + appointment.duration_minutes * 60 * 1000),
            mentorEmail: mentor?.email ?? "",
            mentorName: mentor?.full_name ?? "",
            menteeEmail: mentee?.email ?? "",
            menteeName: mentee?.full_name ?? "",
          })
          googleEventId = created.eventId
          googleMeetLink = created.meetLink
          calendarLink = created.calendarLink
        } catch (error) {
          console.error("[appointments] erro ao criar evento no calendário:", (error as Error).message)
          calendarError = error instanceof Error ? error.message : "Erro desconhecido"
        }
      } else {
        const missing = availability.missing.join(", ") || "Configuração incompleta"
        console.warn("[appointments] Google Calendar não configurado. Faltando:", missing)
        calendarError = `Google Calendar não configurado. Faltando: ${missing}`
      }

      if (googleEventId || googleMeetLink || calendarLink) {
        try {
          await repo.setFields(appointment.id, {
            google_event_id: googleEventId,
            google_meet_link: googleMeetLink,
            google_calendar_link: calendarLink,
          })
        } catch (error) {
          // A sessão está confirmada e o convite já saiu; só o link não foi guardado.
          console.error("[appointments] não foi possível guardar os links do evento:", (error as Error).message)
          calendarError = "O evento foi criado, mas não foi possível guardar o link na sessão."
        }
      }

      if (mentor?.email && mentee?.email) {
        try {
          await deps.mailer.sendConfirmation({
            mentorEmail: mentor.email,
            menteeEmail: mentee.email,
            mentorName: mentor.full_name ?? "",
            menteeName: mentee.full_name ?? "",
            scheduledAt: appointment.scheduled_at,
            meetLink: googleMeetLink,
            calendarLink,
            menteeNotes: appointment.notes_mentee ?? undefined,
            mentorNotes,
          })
        } catch (error) {
          console.error("[appointments] erro ao enviar a confirmação:", (error as Error).message)
        }
      }

      return { kind: "ok", googleEventId, googleMeetLink, calendarError }
    },

    /** Avaliações que o usuário recebeu (como mentor) ou enviou (como mentorado). */
    listFeedbacks(userId: string, type: "sent" | "received"): Promise<FeedbackListItem[]> {
      return deps.admin().feedbacks.listForUser({ userId, type })
    },

    /**
     * O autor edita o próprio comentário público; ele volta para moderação.
     * Antes de a rota existir, qualquer pessoa com o id editava qualquer
     * comentário; o `reviewer_id` conferido aqui é essa correção.
     */
    async updateOwnFeedback(feedbackId: string, userId: string, publicFeedback: string): Promise<UpdateFeedbackResult> {
      // Privilegiado enquanto não houver policy de UPDATE do `reviewer_id` em
      // `appointment_feedbacks` (a tabela não está em nenhuma migration; ADR 0008 §4).
      const { feedbacks } = deps.admin()
      const feedback = await feedbacks.findOwner(feedbackId)
      if (!feedback) return { kind: "not_found" }
      if (feedback.reviewer_id !== userId) return { kind: "forbidden" }
      await feedbacks.updatePublicFeedback(feedbackId, publicFeedback)
      return { kind: "ok" }
    },
  }
}

export type AppointmentsService = ReturnType<typeof createAppointmentsService>
