/**
 * Regras puras do check-in pós-sessão (docs/domains/session-checkin.md §3):
 * prazos e quem recebe e-mail em cada execução do cron. Sem I/O, para testar
 * todos os casos de tempo sem mockar Supabase.
 */
const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

export const CHECKIN_POLICY = {
  /** Só pergunta depois que a sessão terminou há pelo menos isto. */
  afterEndMs: 2 * HOUR_MS,
  /** Sessões mais antigas que isto não recebem check-in (nem bloqueiam agendamento). */
  lookbackMs: 30 * DAY_MS,
  /** Um único lembrete, este tempo depois do primeiro envio. */
  reminderAfterMs: 3 * DAY_MS,
  /** Validade de cada token enviado. */
  tokenTtlMs: 14 * DAY_MS
} as const

export type CheckinRole = "mentor" | "mentee"

export interface CheckinParticipant {
  id: string
  full_name: string | null
  email: string | null
}

export interface CheckinRowState {
  id: string
  role: CheckinRole
  sent_at: string | null
  reminded_at: string | null
  outcome: string | null
  token_hash: string | null
  expires_at: string | null
}

export interface CheckinAppointment {
  id: string
  scheduled_at: string
  duration_minutes: number | null
  status: string
  mentor: CheckinParticipant | null
  mentee: CheckinParticipant | null
  appointment_checkins: CheckinRowState[] | null
}

export type CheckinSend =
  | { kind: "initial"; appointmentId: string; role: CheckinRole }
  | { kind: "reminder"; appointmentId: string; role: CheckinRole; checkinId: string }

/** Fim da sessão; usa 45 min quando a duração não foi gravada (padrão do agendamento). */
export function sessionEndsAt(appointment: Pick<CheckinAppointment, "scheduled_at" | "duration_minutes">): number {
  return new Date(appointment.scheduled_at).getTime() + (appointment.duration_minutes || 45) * 60 * 1000
}

/**
 * Decide os envios desta execução. Regras (§3 do doc): só sessões
 * `confirmed` que terminaram há 2h+ e começaram há no máximo 30 dias; um
 * e-mail por papel; um lembrete 3 dias depois para quem não respondeu; nada
 * para quem não tem e-mail.
 */
export function planCheckinSends(appointments: CheckinAppointment[], now: Date): CheckinSend[] {
  const nowMs = now.getTime()
  const sends: CheckinSend[] = []

  for (const appointment of appointments) {
    if (appointment.status !== "confirmed") continue
    if (sessionEndsAt(appointment) + CHECKIN_POLICY.afterEndMs > nowMs) continue
    if (new Date(appointment.scheduled_at).getTime() < nowMs - CHECKIN_POLICY.lookbackMs) continue

    for (const role of ["mentor", "mentee"] as const) {
      if (!appointment[role]?.email) continue
      const row = appointment.appointment_checkins?.find(c => c.role === role)

      if (!row) {
        sends.push({ kind: "initial", appointmentId: appointment.id, role })
        continue
      }

      const remindable =
        row.outcome === null &&
        row.sent_at !== null &&
        row.reminded_at === null &&
        new Date(row.sent_at).getTime() + CHECKIN_POLICY.reminderAfterMs <= nowMs
      if (remindable) sends.push({ kind: "reminder", appointmentId: appointment.id, role, checkinId: row.id })
    }
  }

  return sends
}
