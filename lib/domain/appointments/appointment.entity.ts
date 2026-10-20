/**
 * Camada 3 · Entity (appointments)
 * Regra: o agendamento como o negócio o entende, derivado da Row gerada com
 * `status` estreitado para os 4 estados do banco. TypeScript puro; o único
 * import é de tipo.
 * Não faz: consultar o banco (repository, camada 5) nem decidir transição de
 * status (appointment-status.entity.ts).
 * Tradeoff: mantém snake_case como o resto do repo, em troca de nenhum mapper de
 * nomes. A única conversão é `status` (coluna `text` no tipo gerado) para a união.
 */
import type { Tables } from "@/lib/types/supabase"
import type { AppointmentStatus, TransitionActor } from "./appointment-status.entity"

type AppointmentRow = Tables<"appointments">

/** Linha inteira de `appointments`, com o status já validado pelo repository. */
export type Appointment = Omit<AppointmentRow, "status"> & { status: AppointmentStatus }

/** O que se sabe da outra ponta de uma sessão. Vem de `profiles`, que o RLS limita. */
export interface AppointmentParty {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  linkedin_url: string | null
}

export type AppointmentWithParties = Appointment & {
  mentor: AppointmentParty | null
  mentee: AppointmentParty | null
}

/** Ponteiro para a avaliação, só o que a lista precisa para saber quem já avaliou. */
export interface AppointmentFeedbackRef {
  id: string
  reviewer_id: string
}

/** Colunas que `GET /api/appointments/list` devolve. Sem `action_token` nem notas. */
export type AppointmentListItem = Pick<
  Appointment,
  | "id"
  | "mentor_id"
  | "mentee_id"
  | "scheduled_at"
  | "duration_minutes"
  | "google_meet_link"
  | "status"
  | "created_at"
  | "message"
  | "topic"
  | "cancellation_reason"
  | "cancelled_by"
> & {
  mentor: AppointmentParty | null
  mentee: AppointmentParty | null
  feedbacks: AppointmentFeedbackRef[]
}

/** Intervalo ocupado de um mentor: tudo que a disponibilidade pública precisa saber. */
export interface BusyInterval {
  scheduled_at: string
  duration_minutes: number
}

/** Validade do link de confirmação enviado ao mentor. */
export const ACTION_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

/** Instante em que um link emitido agora deixa de valer (ISO, pronto para a coluna). */
export function actionTokenExpiry(now: Date = new Date()): string {
  return new Date(now.getTime() + ACTION_TOKEN_TTL_MS).toISOString()
}

/**
 * O link do e-mail venceu? `token_expires_at` nulo vale como "não vence": são as
 * linhas criadas antes de a coluna ser gravada, e quebrar o link delas seria
 * um aviso de "expirou" falso para um pedido que o mentor ainda não viu.
 */
export function isActionTokenExpired(
  appointment: Pick<Appointment, "token_expires_at">,
  now: Date = new Date()
): boolean {
  if (!appointment.token_expires_at) return false
  return new Date(appointment.token_expires_at).getTime() <= now.getTime()
}

/**
 * Papel do usuário no agendamento, ou `null` se não participa. É daqui que o
 * service tira o ator (`mentor`/`mentee`) para `assertTransition`.
 */
export function participantRole(
  appointment: Pick<Appointment, "mentor_id" | "mentee_id">,
  userId: string
): Extract<TransitionActor, "mentor" | "mentee"> | null {
  if (appointment.mentor_id === userId) return "mentor"
  if (appointment.mentee_id === userId) return "mentee"
  return null
}
