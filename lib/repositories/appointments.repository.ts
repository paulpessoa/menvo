/**
 * Camada 5 · Repository (appointments)
 * Regra: único ponto que fala com o banco para `appointments`. Recebe o client
 * por parâmetro: quem monta decide se é o do usuário (RLS) ou, onde o ADR
 * permitir, o `service_role`. O repository não sabe qual é.
 * Não faz: regra de negócio nem decidir se uma transição é permitida (camada 7,
 * com `assertTransition`), nem criar client.
 * Tradeoff: `status` só muda por `transitionStatus`, um update condicional
 * (`where status in (from...)`) que devolve `null` quando perdeu a corrida. É
 * o que o cron e o admin já faziam à mão; aqui vira o único caminho, porque
 * "ler, checar, gravar" em dois passos deixa duas requests passarem juntas.
 * `setFields` não aceita `status` no tipo, de propósito.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database, TablesInsert, TablesUpdate } from "@/lib/types/supabase"
import type {
  Appointment,
  AppointmentListItem,
  AppointmentParty,
  AppointmentWithParties,
  BusyInterval,
} from "@/lib/domain/appointments/appointment.entity"
import { isAppointmentStatus, type AppointmentStatus } from "@/lib/domain/appointments/appointment-status.entity"
import { RepositoryError } from "./repository-error"

type AppointmentInsert = TablesInsert<"appointments">
type AppointmentUpdate = TablesUpdate<"appointments">

/** Campos de um novo pedido. `status` é sempre `pending` (nasce aqui, não vem de fora). */
export type NewAppointment = Pick<AppointmentInsert, "mentor_id" | "mentee_id" | "scheduled_at"> &
  Partial<
    Pick<
      AppointmentInsert,
      | "duration_minutes"
      | "topic"
      | "notes_mentee"
      | "message"
      | "action_token"
      | "token_expires_at"
      | "organization_id"
    >
  >

/** Colunas que acompanham uma transição (motivo, quem cancelou, links criados ao confirmar). */
export type TransitionPatch = Pick<
  AppointmentUpdate,
  | "cancellation_reason"
  | "cancelled_at"
  | "cancelled_by"
  | "completed_at"
  | "notes_mentor"
  | "google_event_id"
  | "google_meet_link"
  | "google_calendar_link"
  | "updated_at"
>

/** Colunas que mudam sem mexer no status. `status` não está aqui de propósito. */
export type FieldsPatch = Pick<
  AppointmentUpdate,
  | "notes_mentor"
  | "google_event_id"
  | "google_meet_link"
  | "google_calendar_link"
  | "pending_reminder_sent_at"
  | "reminded_at"
>

export interface ListForUserInput {
  userId: string
  role?: "mentor" | "mentee"
  status?: AppointmentStatus
  limit: number
}

export interface AppointmentsRepository {
  findById(id: string): Promise<Appointment | null>
  findByActionToken(token: string): Promise<Appointment | null>
  /** Com mentor e mentorado embutidos (uma query, sem N+1). */
  findWithParties(id: string): Promise<AppointmentWithParties | null>
  findWithPartiesByActionToken(token: string): Promise<AppointmentWithParties | null>
  listForUser(input: ListForUserInput): Promise<AppointmentListItem[]>
  /** Já existe pedido pendente ou confirmado deste mentor neste horário exato? */
  hasSlotConflict(mentorId: string, scheduledAt: string): Promise<boolean>
  /** Horários pendentes/confirmados do mentor no intervalo, para a disponibilidade. */
  listBusyIntervals(mentorId: string, from: Date, to: Date): Promise<BusyInterval[]>
  insertPending(row: NewAppointment): Promise<AppointmentWithParties>
  /**
   * Muda o status só se a linha ainda estiver em um dos estados `from`.
   * Devolve a linha nova, ou `null` se ninguém casou (id inexistente ou o
   * status já mudou: o service diferencia relendo).
   */
  transitionStatus(input: {
    id: string
    from: AppointmentStatus | readonly AppointmentStatus[]
    to: AppointmentStatus
    patch?: TransitionPatch
  }): Promise<Appointment | null>
  setFields(id: string, patch: FieldsPatch): Promise<void>
  /** Troca o token de um pedido ainda pendente. `false` se o status já mudou. */
  renewActionToken(id: string, token: string, expiresAt: string): Promise<boolean>
}

const PARTY_COLUMNS = "id, full_name, email, avatar_url, linkedin_url"
const PARTIES = `mentor:profiles!mentor_id(${PARTY_COLUMNS}), mentee:profiles!mentee_id(${PARTY_COLUMNS})`

const LIST_COLUMNS =
  "id, mentor_id, mentee_id, scheduled_at, duration_minutes, google_meet_link, status, created_at, message, topic, cancellation_reason, cancelled_by"
const LIST_SELECT = `${LIST_COLUMNS}, ${PARTIES}, feedbacks:appointment_feedbacks(id, reviewer_id)`

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Postgres `22P02`: texto que não é UUID. Para o app é "não encontrei", como as rotas já tratavam. */
function isInvalidUuid(error: { code?: string } | null): boolean {
  return error?.code === "22P02"
}

/** O PostgREST devolve o embed como objeto ou lista de 1, conforme a relação. */
function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

function assertStatus(value: unknown, operation: string): AppointmentStatus {
  if (!isAppointmentStatus(value)) {
    // O CHECK do banco só aceita 4 valores; chegar aqui é migration nova sem atualizar a entity.
    throw new RepositoryError(operation, { message: `status desconhecido: ${String(value)}` })
  }
  return value
}

type RawRow = { status: unknown } & Record<string, unknown>

function toAppointment(row: RawRow, operation: string): Appointment {
  return { ...row, status: assertStatus(row.status, operation) } as Appointment
}

function toParty(raw: unknown): AppointmentParty | null {
  return one(raw as AppointmentParty | AppointmentParty[] | null)
}

function toWithParties(row: RawRow, operation: string): AppointmentWithParties {
  const { mentor, mentee, ...rest } = row
  return { ...toAppointment(rest as RawRow, operation), mentor: toParty(mentor), mentee: toParty(mentee) }
}

function toListItem(row: RawRow): AppointmentListItem {
  const { mentor, mentee, feedbacks, ...rest } = row
  return {
    ...(toAppointment(rest as RawRow, "appointments.listForUser") as Omit<AppointmentListItem, "mentor" | "mentee" | "feedbacks">),
    mentor: toParty(mentor),
    mentee: toParty(mentee),
    feedbacks: Array.isArray(feedbacks) ? (feedbacks as AppointmentListItem["feedbacks"]) : [],
  }
}

export function createAppointmentsRepository(
  db: SupabaseClient<Database>,
  now: () => Date = () => new Date()
): AppointmentsRepository {
  async function findOne(
    operation: string,
    column: "id" | "action_token",
    value: string,
    select: string
  ): Promise<RawRow | null> {
    const { data, error } = await db.from("appointments").select(select).eq(column, value).maybeSingle()
    if (error) {
      if (isInvalidUuid(error)) return null
      throw new RepositoryError(operation, error)
    }
    return (data as unknown as RawRow | null) ?? null
  }

  return {
    async findById(id) {
      const row = await findOne("appointments.findById", "id", id, "*")
      return row ? toAppointment(row, "appointments.findById") : null
    },

    async findByActionToken(token) {
      const row = await findOne("appointments.findByActionToken", "action_token", token, "*")
      return row ? toAppointment(row, "appointments.findByActionToken") : null
    },

    async findWithParties(id) {
      const row = await findOne("appointments.findWithParties", "id", id, `*, ${PARTIES}`)
      return row ? toWithParties(row, "appointments.findWithParties") : null
    },

    async findWithPartiesByActionToken(token) {
      const row = await findOne("appointments.findWithPartiesByActionToken", "action_token", token, `*, ${PARTIES}`)
      return row ? toWithParties(row, "appointments.findWithPartiesByActionToken") : null
    },

    async listForUser({ userId, role, status, limit }) {
      // O id entra numa string de filtro (.or); só UUID passa, para ninguém injetar um filtro.
      if (!UUID_PATTERN.test(userId)) throw new RepositoryError("appointments.listForUser", { message: "userId não é UUID" })

      let query = db.from("appointments").select(LIST_SELECT).order("scheduled_at", { ascending: false }).limit(limit)
      if (role === "mentor") query = query.eq("mentor_id", userId)
      else if (role === "mentee") query = query.eq("mentee_id", userId)
      else query = query.or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`)
      if (status) query = query.eq("status", status)

      const { data, error } = await query
      if (error) throw new RepositoryError("appointments.listForUser", error)
      return ((data as unknown as RawRow[] | null) ?? []).map(toListItem)
    },

    async hasSlotConflict(mentorId, scheduledAt) {
      const { data, error } = await db
        .from("appointments")
        .select("id")
        .eq("mentor_id", mentorId)
        .eq("scheduled_at", scheduledAt)
        .in("status", ["pending", "confirmed"])
        .limit(1)
      if (error) throw new RepositoryError("appointments.hasSlotConflict", error)
      return (data?.length ?? 0) > 0
    },

    async listBusyIntervals(mentorId, from, to) {
      const { data, error } = await db
        .from("appointments")
        .select("scheduled_at, duration_minutes")
        .eq("mentor_id", mentorId)
        .in("status", ["pending", "confirmed"])
        .gte("scheduled_at", from.toISOString())
        .lte("scheduled_at", to.toISOString())
      if (error) throw new RepositoryError("appointments.listBusyIntervals", error)
      return data ?? []
    },

    async insertPending(row) {
      const { data, error } = await db
        .from("appointments")
        .insert({ ...row, status: "pending" })
        .select(`*, ${PARTIES}`)
        .single()
      if (error) throw new RepositoryError("appointments.insertPending", error)
      return toWithParties(data as unknown as RawRow, "appointments.insertPending")
    },

    async transitionStatus({ id, from, to, patch }) {
      const froms = Array.isArray(from) ? [...from] : [from as AppointmentStatus]
      const { data, error } = await db
        .from("appointments")
        .update({ ...patch, status: to, updated_at: patch?.updated_at ?? now().toISOString() })
        .eq("id", id)
        .in("status", froms)
        .select("*")
      if (error) {
        if (isInvalidUuid(error)) return null
        throw new RepositoryError("appointments.transitionStatus", error)
      }
      const row = (data as unknown as RawRow[] | null)?.[0]
      return row ? toAppointment(row, "appointments.transitionStatus") : null
    },

    async setFields(id, patch) {
      const { error } = await db
        .from("appointments")
        .update({ ...patch, updated_at: now().toISOString() })
        .eq("id", id)
      if (error) throw new RepositoryError("appointments.setFields", error)
    },

    async renewActionToken(id, token, expiresAt) {
      const { data, error } = await db
        .from("appointments")
        .update({ action_token: token, token_expires_at: expiresAt, updated_at: now().toISOString() })
        .eq("id", id)
        .eq("status", "pending")
        .select("id")
      if (error) throw new RepositoryError("appointments.renewActionToken", error)
      return (data?.length ?? 0) > 0
    },
  }
}
