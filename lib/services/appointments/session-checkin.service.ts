/**
 * Envio do check-in pós-sessão ("a mentoria aconteceu?") pelo cron diário de
 * appointments. Ver docs/domains/session-checkin.md.
 *
 * A decisão de quem recebe o quê é `planCheckinSends`, pura e testada; a
 * execução (`runSessionCheckins`) só cria linhas, gira tokens e envia. A
 * resposta não passa por aqui: chega pelas funções do banco
 * (answer_session_checkin etc.), sem service_role.
 */
import { createHash, randomBytes } from "crypto"
import { createServiceRoleClient, ensureServerSide } from "@/lib/utils/supabase/service-role"
import { sendSessionCheckin } from "@/lib/email/brevo"
import {
  CHECKIN_POLICY,
  planCheckinSends,
  type CheckinAppointment
} from "@/lib/domain/appointments/session-checkin.entity"

/** Token de 32 bytes (base64url) e o hash sha256 que fica no banco - o mesmo que o SQL calcula. */
export function createCheckinToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url")
  return { token, hash: hashCheckinToken(token) }
}

export function hashCheckinToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

function checkinUrl(token: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.menvo.com.br"
  return `${appUrl}/checkin/${token}`
}

export interface CheckinRunReport {
  sent: number
  reminded: number
  errors: string[]
}

/**
 * Executa o plano. Corridas e falhas: o envio inicial é "reivindicado" pelo
 * insert (unique appointment_id+role), então duas execuções não mandam dois
 * e-mails; o lembrete reivindica com `reminded_at is null`. Se o Brevo
 * falhar, a reivindicação é desfeita e a próxima execução tenta de novo.
 */
export async function runSessionCheckins(now: Date = new Date()): Promise<CheckinRunReport> {
  ensureServerSide()
  const supabase = createServiceRoleClient()
  const report: CheckinRunReport = { sent: 0, reminded: 0, errors: [] }

  const { data, error } = await supabase
    .from("appointments")
    .select(`
      id, scheduled_at, duration_minutes, status,
      mentor:profiles!mentor_id(id, full_name, email),
      mentee:profiles!mentee_id(id, full_name, email),
      appointment_checkins(id, role, sent_at, reminded_at, outcome, token_hash, expires_at)
    `)
    .eq("status", "confirmed")
    .gte("scheduled_at", new Date(now.getTime() - CHECKIN_POLICY.lookbackMs).toISOString())
    .lte("scheduled_at", now.toISOString())

  if (error) {
    report.errors.push(`Erro busca check-in: ${error.message}`)
    return report
  }

  const appointments = (data ?? []) as unknown as CheckinAppointment[]
  const byId = new Map(appointments.map(a => [a.id, a]))
  const expiresAt = new Date(now.getTime() + CHECKIN_POLICY.tokenTtlMs).toISOString()

  for (const send of planCheckinSends(appointments, now)) {
    const appointment = byId.get(send.appointmentId)!
    const recipient = appointment[send.role]!
    const other = appointment[send.role === "mentor" ? "mentee" : "mentor"]
    const { token, hash } = createCheckinToken()
    let rollback: (() => PromiseLike<unknown>) | null = null

    try {

      if (send.kind === "initial") {
        const { data: inserted, error: insertError } = await supabase
          .from("appointment_checkins")
          .insert({
            appointment_id: appointment.id,
            participant_id: recipient.id,
            role: send.role,
            token_hash: hash,
            expires_at: expiresAt,
            sent_at: now.toISOString()
          })
          .select("id")
          .maybeSingle()
        if (insertError || !inserted) continue // outra execução já reivindicou
        rollback = () => supabase.from("appointment_checkins").delete().eq("id", inserted.id)
      } else {
        const previous = appointment.appointment_checkins!.find(c => c.id === send.checkinId)!
        const { data: claimed, error: claimError } = await supabase
          .from("appointment_checkins")
          .update({ token_hash: hash, expires_at: expiresAt, reminded_at: now.toISOString() })
          .eq("id", send.checkinId)
          .is("reminded_at", null)
          .is("outcome", null)
          .select("id")
          .maybeSingle()
        if (claimError || !claimed) continue
        rollback = () =>
          supabase
            .from("appointment_checkins")
            .update({ token_hash: previous.token_hash, expires_at: previous.expires_at, reminded_at: null })
            .eq("id", send.checkinId)
      }

      const result = await sendSessionCheckin({
        email: recipient.email!,
        firstName: recipient.full_name?.split(" ")[0] || "",
        otherPersonName: other?.full_name || (send.role === "mentor" ? "seu mentorado" : "seu mentor"),
        scheduledAt: appointment.scheduled_at,
        role: send.role,
        checkinUrl: checkinUrl(token),
        isReminder: send.kind === "reminder"
      })

      if (!result.success) {
        await rollback()
        rollback = null
        report.errors.push(`Erro envio check-in ${appointment.id}/${send.role}: ${result.error}`)
        continue
      }

      if (send.kind === "initial") report.sent++
      else report.reminded++
    } catch (err) {
      if (rollback) await Promise.resolve(rollback()).catch(() => undefined)
      report.errors.push(`Erro check-in ${appointment.id}/${send.role}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return report
}
