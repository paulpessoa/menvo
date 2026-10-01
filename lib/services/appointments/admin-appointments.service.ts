import { randomUUID } from "crypto"
import type { SupabaseClient } from "@supabase/supabase-js"
import { isPlaceholderName } from "@/lib/utils/person-name"
import {
  sendAppointmentCancellation,
  sendAppointmentConfirmation,
  sendAppointmentRequest
} from "@/lib/email/brevo"
import {
  deleteCalendarEvent,
  isGoogleCalendarConfigured
} from "@/lib/services/mentorship/google-calendar.service"

/**
 * Gestão de sessões de mentoria pela equipe (/dashboard/admin/appointments).
 *
 * Toda a regra fica aqui; as rotas em app/api/admin/appointments/** só
 * autenticam (requireAdmin), validam o corpo e chamam estas funções.
 * O cliente recebido precisa ser o de service role: ele lê e altera sessões
 * de qualquer usuário, então NUNCA chame isto sem requireAdmin antes.
 */

/** Acima disso um pedido pendente é destacado como "sem resposta". */
export const PENDING_STALE_AFTER_HOURS = 48
/** Validade do link de confirmação enviado ao mentor (igual ao do pedido original). */
export const ACTION_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000
/** Teto de linhas por consulta; acima disso a lista avisa que está truncada. */
export const ADMIN_LIST_LIMIT = 1000
export const ADMIN_CANCELLER_NAME = "Equipe MENVO"

const EXPIRED_REASON_PREFIX = "Pedido expirado"
const NO_MESSAGE_PLACEHOLDER = "O mentorado não deixou uma mensagem."

export class AdminAppointmentError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string
  ) {
    super(message)
    this.name = "AdminAppointmentError"
  }
}

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type PersonRow = { id: string; full_name: string | null; email: string | null }

interface AppointmentRow {
  id: string
  status: string
  scheduled_at: string
  duration_minutes: number | null
  created_at: string
  updated_at: string | null
  topic: string | null
  notes_mentee: string | null
  message: string | null
  notes_mentor: string | null
  cancellation_reason: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  google_event_id: string | null
  google_meet_link: string | null
  google_calendar_link: string | null
  token_expires_at: string | null
  pending_reminder_sent_at: string | null
  mentor: PersonRow | PersonRow[] | null
  mentee: PersonRow | PersonRow[] | null
}

/** Linha de uso interno: traz o token de confirmação, que NUNCA vai para o navegador. */
interface AppointmentRowWithToken extends AppointmentRow {
  action_token: string | null
}

export interface AdminPerson {
  id: string | null
  name: string | null
  email: string | null
  /** Nome vazio ou genérico ("Usuário Teste"): o convite sai sem identificar a pessoa. */
  nameIncomplete: boolean
}

export interface AdminAppointment {
  id: string
  status: string
  statusLabel: string
  scheduledAt: string
  durationMinutes: number | null
  createdAt: string
  updatedAt: string | null
  mentor: AdminPerson
  mentee: AdminPerson
  reason: string | null
  topic: string | null
  mentorNotes: string | null
  cancellationReason: string | null
  cancelledAt: string | null
  /** `system` = expirado pelo cron; `user` = alguém cancelou; null = não cancelada. */
  cancelledBy: "system" | "user" | null
  googleMeetLink: string | null
  googleCalendarLink: string | null
  hasCalendarEvent: boolean
  pendingReminderSentAt: string | null
  flags: {
    /** Pendente e o horário ainda não passou. */
    awaitingMentor: boolean
    /** Horas desde o pedido, só para pendentes. */
    waitingHours: number | null
    /** Pendente há mais de PENDING_STALE_AFTER_HOURS. */
    stale: boolean
    sessionPassed: boolean
    /** O link de confirmação enviado ao mentor já expirou. */
    tokenExpired: boolean
    missingReason: boolean
  }
  actions: {
    resendMentorRequest: boolean
    resendConfirmation: boolean
    cancel: boolean
  }
}

export interface AdminAppointmentsResult {
  appointments: AdminAppointment[]
  counts: Record<string, number>
  total: number
  truncated: boolean
}

// ---------------------------------------------------------------------------
// Helpers puros (testáveis sem banco)
// ---------------------------------------------------------------------------

// A regra de "nome genérico" é compartilhada com o login social (lib/utils/person-name).
export { isPlaceholderName }

const STATUS_LABELS: Record<string, string> = {
  pending: "Aguardando mentor",
  confirmed: "Confirmada",
  completed: "Concluída",
  cancelled: "Cancelada",
  rejected: "Recusada"
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

function toPerson(value: PersonRow | PersonRow[] | null): AdminPerson {
  const row = one(value)
  return {
    id: row?.id ?? null,
    name: row?.full_name?.trim() || null,
    email: row?.email ?? null,
    nameIncomplete: isPlaceholderName(row?.full_name)
  }
}

function resolveReason(row: Pick<AppointmentRow, "notes_mentee" | "message">): string | null {
  return row.notes_mentee?.trim() || row.message?.trim() || null
}

function isSystemExpired(row: Pick<AppointmentRow, "status" | "cancelled_by" | "cancellation_reason">) {
  return (
    row.status === "cancelled" &&
    !row.cancelled_by &&
    (row.cancellation_reason ?? "").startsWith(EXPIRED_REASON_PREFIX)
  )
}

export function toAdminAppointment(row: AppointmentRow, now: Date = new Date()): AdminAppointment {
  const scheduled = new Date(row.scheduled_at)
  const sessionPassed = scheduled.getTime() <= now.getTime()
  const isPending = row.status === "pending"
  const waitingHours = isPending
    ? Math.max(0, Math.floor((now.getTime() - new Date(row.created_at).getTime()) / 3_600_000))
    : null
  const reason = resolveReason(row)
  const expired = isSystemExpired(row)

  return {
    id: row.id,
    status: row.status,
    statusLabel: expired ? "Expirada" : (STATUS_LABELS[row.status] ?? row.status),
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    mentor: toPerson(row.mentor),
    mentee: toPerson(row.mentee),
    reason,
    topic: row.topic,
    mentorNotes: row.notes_mentor,
    cancellationReason: row.cancellation_reason,
    cancelledAt: row.cancelled_at,
    cancelledBy: row.status === "cancelled" ? (row.cancelled_by ? "user" : "system") : null,
    googleMeetLink: row.google_meet_link,
    googleCalendarLink: row.google_calendar_link,
    hasCalendarEvent: Boolean(row.google_event_id),
    pendingReminderSentAt: row.pending_reminder_sent_at,
    flags: {
      awaitingMentor: isPending && !sessionPassed,
      waitingHours,
      stale: isPending && waitingHours !== null && waitingHours >= PENDING_STALE_AFTER_HOURS,
      sessionPassed,
      tokenExpired:
        isPending &&
        Boolean(row.token_expires_at) &&
        new Date(row.token_expires_at as string).getTime() <= now.getTime(),
      missingReason: !reason
    },
    actions: {
      resendMentorRequest: isPending && !sessionPassed,
      resendConfirmation: row.status === "confirmed" && !sessionPassed,
      cancel: row.status === "pending" || row.status === "confirmed"
    }
  }
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

export function matchesSearch(appointment: AdminAppointment, query: string): boolean {
  const needle = normalizeText(query.trim())
  if (!needle) return true
  const haystack = normalizeText(
    [
      appointment.id,
      appointment.mentor.name,
      appointment.mentor.email,
      appointment.mentee.name,
      appointment.mentee.email,
      appointment.reason,
      appointment.topic
    ]
      .filter(Boolean)
      .join(" ")
  )
  return haystack.includes(needle)
}

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------

const PERSON_EMBED = "id, full_name, email"

const LIST_SELECT = `
  id, status, scheduled_at, duration_minutes, created_at, updated_at, topic,
  notes_mentee, message, notes_mentor, cancellation_reason, cancelled_at,
  cancelled_by, google_event_id, google_meet_link, google_calendar_link,
  token_expires_at, pending_reminder_sent_at,
  mentor:profiles!mentor_id(${PERSON_EMBED}),
  mentee:profiles!mentee_id(${PERSON_EMBED})
`

// Só para ações internas (reenvio): inclui o token de confirmação.
const ACTION_SELECT = `${LIST_SELECT}, action_token`

type AnyClient = SupabaseClient<any, any, any>

export interface ListAdminAppointmentsOptions {
  /** `all`/vazio = sem filtro. */
  status?: string | null
  q?: string | null
  now?: Date
}

export async function listAdminAppointments(
  client: AnyClient,
  { status, q, now = new Date() }: ListAdminAppointmentsOptions = {}
): Promise<AdminAppointmentsResult> {
  const { data, error } = await client
    .from("appointments")
    .select(LIST_SELECT)
    .order("created_at", { ascending: false })
    .limit(ADMIN_LIST_LIMIT)

  if (error) {
    throw new AdminAppointmentError("Não foi possível carregar as sessões.", 500, "QUERY_FAILED")
  }

  const rows = ((data ?? []) as unknown as AppointmentRow[]).map(row => toAdminAppointment(row, now))

  // As contagens vêm de todas as linhas, antes dos filtros, para as abas não "sumirem".
  const counts: Record<string, number> = { all: rows.length }
  for (const row of rows) counts[row.status] = (counts[row.status] ?? 0) + 1

  const filtered = rows.filter(row => {
    if (status && status !== "all" && row.status !== status) return false
    return q ? matchesSearch(row, q) : true
  })

  return {
    appointments: filtered,
    counts,
    total: filtered.length,
    truncated: rows.length >= ADMIN_LIST_LIMIT
  }
}

async function fetchForAction(client: AnyClient, id: string): Promise<AppointmentRowWithToken> {
  const { data, error } = await client
    .from("appointments")
    .select(ACTION_SELECT)
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw new AdminAppointmentError("Não foi possível carregar a sessão.", 500, "QUERY_FAILED")
  }
  if (!data) {
    throw new AdminAppointmentError("Agendamento não encontrado.", 404, "NOT_FOUND")
  }
  return data as unknown as AppointmentRowWithToken
}

// ---------------------------------------------------------------------------
// Ações
// ---------------------------------------------------------------------------

/** Reenvia ao mentor o e-mail com o botão "Confirmar Agendamento". */
export async function resendMentorRequest(
  client: AnyClient,
  id: string,
  now: Date = new Date()
): Promise<{ sentTo: string; tokenRenewed: boolean }> {
  const row = await fetchForAction(client, id)

  if (row.status !== "pending") {
    throw new AdminAppointmentError(
      "Só dá para reenviar o pedido de uma sessão que está aguardando o mentor.",
      409,
      "INVALID_STATUS"
    )
  }
  if (new Date(row.scheduled_at).getTime() <= now.getTime()) {
    throw new AdminAppointmentError(
      "O horário da sessão já passou. Cancele o pedido em vez de reenviar.",
      409,
      "SESSION_PASSED"
    )
  }

  const mentor = one(row.mentor)
  const mentee = one(row.mentee)
  if (!mentor?.email) {
    throw new AdminAppointmentError("O mentor não tem e-mail cadastrado.", 422, "NO_RECIPIENT")
  }

  // O link antigo pode ter vencido (7 dias). Nesse caso gera um novo, senão o
  // e-mail reenviado levaria a um botão que não funciona.
  let token = row.action_token
  let tokenRenewed = false
  const expiresAt = row.token_expires_at ? new Date(row.token_expires_at).getTime() : 0
  if (!token || expiresAt <= now.getTime()) {
    token = randomUUID()
    tokenRenewed = true
    const { data: updated, error } = await client
      .from("appointments")
      .update({
        action_token: token,
        token_expires_at: new Date(now.getTime() + ACTION_TOKEN_TTL_MS).toISOString(),
        updated_at: now.toISOString()
      })
      .eq("id", id)
      .eq("status", "pending")
      .select("id")

    if (error) {
      throw new AdminAppointmentError("Não foi possível renovar o link de confirmação.", 500, "UPDATE_FAILED")
    }
    if (!updated?.length) {
      throw new AdminAppointmentError(
        "A sessão mudou de status. Atualize a lista e tente de novo.",
        409,
        "STATUS_CHANGED"
      )
    }
  }

  await sendAppointmentRequest({
    mentorEmail: mentor.email,
    mentorName: mentor.full_name?.trim() || "Mentor",
    menteeName: mentee?.full_name?.trim() || mentee?.email || "Mentorado",
    scheduledAt: row.scheduled_at,
    message: resolveReason(row) ?? NO_MESSAGE_PLACEHOLDER,
    token
  })

  return { sentTo: mentor.email, tokenRenewed }
}

/** Reenvia a confirmação (com link do Meet e do calendário) para mentor e mentorado. */
export async function resendConfirmation(
  client: AnyClient,
  id: string,
  now: Date = new Date()
): Promise<{ sentTo: string[] }> {
  const row = await fetchForAction(client, id)

  if (row.status !== "confirmed") {
    throw new AdminAppointmentError(
      "Só dá para reenviar a confirmação de uma sessão confirmada.",
      409,
      "INVALID_STATUS"
    )
  }
  if (new Date(row.scheduled_at).getTime() <= now.getTime()) {
    throw new AdminAppointmentError("O horário da sessão já passou.", 409, "SESSION_PASSED")
  }

  const mentor = one(row.mentor)
  const mentee = one(row.mentee)
  if (!mentor?.email || !mentee?.email) {
    throw new AdminAppointmentError(
      "Mentor ou mentorado sem e-mail cadastrado.",
      422,
      "NO_RECIPIENT"
    )
  }

  await sendAppointmentConfirmation({
    mentorEmail: mentor.email,
    menteeEmail: mentee.email,
    mentorName: mentor.full_name?.trim() || "Mentor",
    menteeName: mentee.full_name?.trim() || mentee.email,
    scheduledAt: row.scheduled_at,
    meetLink: row.google_meet_link,
    calendarLink: row.google_calendar_link,
    menteeNotes: resolveReason(row) ?? undefined,
    mentorNotes: row.notes_mentor ?? undefined
  })

  return { sentTo: [mentor.email, mentee.email] }
}

export interface AdminCancelResult {
  /** null = não havia evento (ou o Google Calendar não está configurado). */
  calendarEventRemoved: boolean | null
  notified: { mentor: boolean; mentee: boolean }
}

/**
 * Cancela a sessão em nome da equipe: avisa mentor E mentorado (a rota
 * pública /api/appointments/cancel decide o destinatário pelo usuário logado,
 * o que erraria a pessoa quando quem cancela é um admin) e remove o evento do
 * Google Calendar para o convite sumir da agenda de todos.
 */
export async function cancelAppointmentAsAdmin(
  client: AnyClient,
  id: string,
  adminUserId: string,
  reason: string,
  now: Date = new Date()
): Promise<AdminCancelResult> {
  const row = await fetchForAction(client, id)

  if (row.status !== "pending" && row.status !== "confirmed") {
    throw new AdminAppointmentError(
      "Só dá para cancelar sessões pendentes ou confirmadas.",
      409,
      "INVALID_STATUS"
    )
  }

  const nowIso = now.toISOString()
  // O filtro por status evita cancelar por cima de uma confirmação que acabou
  // de acontecer (mesma proteção que o cron usa).
  const { data: updated, error } = await client
    .from("appointments")
    .update({
      status: "cancelled",
      cancellation_reason: reason,
      cancelled_at: nowIso,
      cancelled_by: adminUserId,
      updated_at: nowIso
    })
    .eq("id", id)
    .in("status", ["pending", "confirmed"])
    .select("id")

  if (error) {
    throw new AdminAppointmentError("Erro ao cancelar o agendamento.", 500, "UPDATE_FAILED")
  }
  if (!updated?.length) {
    throw new AdminAppointmentError(
      "A sessão mudou de status. Atualize a lista e tente de novo.",
      409,
      "STATUS_CHANGED"
    )
  }

  let calendarEventRemoved: boolean | null = null
  if (row.google_event_id && isGoogleCalendarConfigured()) {
    try {
      await deleteCalendarEvent(adminUserId, row.google_event_id)
      calendarEventRemoved = true
    } catch (calendarError) {
      console.error("[ADMIN CANCEL] Falha ao remover evento do Google Calendar:", calendarError)
      calendarEventRemoved = false
    }
  }

  const mentor = one(row.mentor)
  const mentee = one(row.mentee)
  const mentorName = mentor?.full_name?.trim() || "Mentor"
  const menteeName = mentee?.full_name?.trim() || mentee?.email || "Mentorado"

  const send = async (recipient: PersonRow | null, recipientName: string, otherName: string) => {
    if (!recipient?.email) return false
    try {
      await sendAppointmentCancellation({
        recipientEmail: recipient.email,
        recipientName,
        otherPersonName: otherName,
        scheduledAt: row.scheduled_at,
        reason,
        cancelledByName: ADMIN_CANCELLER_NAME
      })
      return true
    } catch (emailError) {
      console.error("[ADMIN CANCEL] Falha ao enviar e-mail de cancelamento:", emailError)
      return false
    }
  }

  const [mentorNotified, menteeNotified] = await Promise.all([
    send(mentor, mentorName, menteeName),
    send(mentee, menteeName, mentorName)
  ])

  return {
    calendarEventRemoved,
    notified: { mentor: mentorNotified, mentee: menteeNotified }
  }
}

/** Converte qualquer erro em corpo + status HTTP para as rotas de admin. */
export function toAdminErrorResponse(error: unknown): {
  body: { error: string; code: string }
  status: number
} {
  if (error instanceof AdminAppointmentError) {
    return { body: { error: error.message, code: error.code }, status: error.status }
  }
  console.error("[ADMIN APPOINTMENTS] Erro inesperado:", error)
  return { body: { error: "Erro interno do servidor", code: "INTERNAL" }, status: 500 }
}
