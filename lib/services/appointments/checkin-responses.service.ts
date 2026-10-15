/**
 * Respostas ao check-in pós-sessão (docs/domains/session-checkin.md): pela
 * página /checkin/[token] (sem login) e pelo bloqueio de agendamento (logado).
 * Tudo passa pelas funções security definer do banco com o cliente comum -
 * a validação do token e a regra de status ficam no SQL, não aqui.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import {
  checkinOkSchema,
  checkinRpcErrorSchema,
  checkinSummarySchema,
  checkinTokenSchema,
  type CheckinDetails,
  type CheckinOutcome,
  type CheckinSummary
} from "@/lib/schemas/session-checkin"
import { CHECKIN_POLICY, sessionEndsAt } from "@/lib/domain/appointments/session-checkin.entity"

type Db = SupabaseClient<Database>

export type CheckinResult<T> = { ok: true; data: T } | { ok: false; error: string }

function parseRpc<T>(data: unknown, schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false } }): CheckinResult<T> {
  const failure = checkinRpcErrorSchema.safeParse(data)
  if (failure.success) return { ok: false, error: failure.data.error }
  const parsed = schema.safeParse(data)
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false, error: "unexpected_response" }
}

/** Lê o check-in do token sem alterar nada (a página abre com isto). */
export async function getCheckin(db: Db, token: string): Promise<CheckinResult<CheckinSummary>> {
  if (!checkinTokenSchema.safeParse(token).success) return { ok: false, error: "invalid_token" }
  const { data, error } = await db.rpc("get_session_checkin", { p_token: token })
  if (error) return { ok: false, error: error.message }
  return parseRpc(data, checkinSummarySchema)
}

/** Grava a resposta do token. A primeira resposta vale; repetir devolve o estado atual. */
export async function answerCheckin(db: Db, token: string, outcome: CheckinOutcome): Promise<CheckinResult<CheckinSummary>> {
  if (!checkinTokenSchema.safeParse(token).success) return { ok: false, error: "invalid_token" }
  const { data, error } = await db.rpc("answer_session_checkin", { p_token: token, p_outcome: outcome })
  if (error) return { ok: false, error: error.message }
  return parseRpc(data, checkinSummarySchema)
}

/** Nota, comentário e próximo passo (mentorado) ou nota privada (mentor), depois do "aconteceu". */
export async function submitCheckinDetails(db: Db, token: string, details: CheckinDetails): Promise<CheckinResult<true>> {
  if (!checkinTokenSchema.safeParse(token).success) return { ok: false, error: "invalid_token" }
  const { data, error } = await db.rpc("submit_session_checkin_details", {
    p_token: token,
    // A função aceita nulo para o mentor; o tipo gerado não sabe disso.
    p_rating: details.rating as number,
    p_public_feedback: details.publicFeedback,
    p_private_note: details.privateNote,
    p_next_step: details.nextStep
  })
  if (error) return { ok: false, error: error.message }
  const result = parseRpc(data, checkinOkSchema)
  return result.ok ? { ok: true, data: true } : result
}

/** Resposta de dentro da plataforma, pelo usuário logado (participante da sessão). */
export async function answerMyCheckin(db: Db, appointmentId: string, outcome: CheckinOutcome): Promise<CheckinResult<true>> {
  const { data, error } = await db.rpc("answer_my_session_checkin", { p_appointment_id: appointmentId, p_outcome: outcome })
  if (error) return { ok: false, error: error.message }
  const result = parseRpc(data, checkinOkSchema)
  return result.ok ? { ok: true, data: true } : result
}

export interface PendingCheckin {
  appointmentId: string
  scheduledAt: string
  mentorName: string
}

/**
 * Sessão que bloqueia um novo agendamento (§4 do doc): a mais antiga entre as
 * `confirmed` do mentorado que terminaram há 2h+, começaram nos últimos 30
 * dias e ainda não têm resposta dele. Uma consulta, com o RLS do próprio
 * usuário (lê só as próprias sessões e os próprios check-ins).
 */
export async function findPendingMenteeCheckin(db: Db, menteeId: string, now: Date = new Date()): Promise<PendingCheckin | null> {
  const { data, error } = await db
    .from("appointments")
    .select("id, scheduled_at, duration_minutes, mentor:profiles!mentor_id(full_name), appointment_checkins(role, outcome)")
    .eq("mentee_id", menteeId)
    .eq("status", "confirmed")
    .gte("scheduled_at", new Date(now.getTime() - CHECKIN_POLICY.lookbackMs).toISOString())
    .lte("scheduled_at", now.toISOString())
    .order("scheduled_at", { ascending: true })

  if (error || !data) return null

  type Row = {
    id: string
    scheduled_at: string
    duration_minutes: number | null
    mentor: { full_name: string | null } | null
    appointment_checkins: { role: string; outcome: string | null }[] | null
  }

  const pending = (data as unknown as Row[]).find(row => {
    if (sessionEndsAt(row) + CHECKIN_POLICY.afterEndMs > now.getTime()) return false
    const mine = row.appointment_checkins?.find(c => c.role === "mentee")
    return !mine?.outcome
  })

  return pending
    ? { appointmentId: pending.id, scheduledAt: pending.scheduled_at, mentorName: pending.mentor?.full_name || "seu mentor" }
    : null
}
