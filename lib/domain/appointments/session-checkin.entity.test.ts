import { planCheckinSends, type CheckinAppointment, type CheckinRowState } from "./session-checkin.entity"

const NOW = new Date("2026-10-20T12:00:00.000Z")
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 60 * 60 * 1000).toISOString()
const daysAgo = (d: number) => hoursAgo(d * 24)

function appointment(overrides: Partial<CheckinAppointment> = {}): CheckinAppointment {
  return {
    id: "appt-1",
    scheduled_at: hoursAgo(5),
    duration_minutes: 45,
    status: "confirmed",
    mentor: { id: "mentor-1", full_name: "Marta Mentora", email: "marta@test.menvo" },
    mentee: { id: "mentee-1", full_name: "Edu Mentorado", email: "edu@test.menvo" },
    appointment_checkins: [],
    ...overrides
  }
}

function row(overrides: Partial<CheckinRowState> = {}): CheckinRowState {
  return {
    id: "chk-1",
    role: "mentee",
    sent_at: daysAgo(4),
    reminded_at: null,
    outcome: null,
    token_hash: "hash",
    expires_at: daysAgo(-10),
    ...overrides
  }
}

describe("planCheckinSends", () => {
  it("envia o primeiro check-in para os dois lados de uma sessão que terminou há 2h+", () => {
    expect(planCheckinSends([appointment()], NOW)).toEqual([
      { kind: "initial", appointmentId: "appt-1", role: "mentor" },
      { kind: "initial", appointmentId: "appt-1", role: "mentee" }
    ])
  })

  it("espera 2h depois do fim da sessão (início + duração)", () => {
    // começou há 2h30, durou 45 min: terminou há 1h45
    expect(planCheckinSends([appointment({ scheduled_at: hoursAgo(2.5) })], NOW)).toEqual([])
    // começou há 2h50: terminou há 2h05
    expect(planCheckinSends([appointment({ scheduled_at: hoursAgo(2 + 50 / 60) })], NOW)).toHaveLength(2)
  })

  it("usa 45 min quando a duração não foi gravada", () => {
    expect(planCheckinSends([appointment({ scheduled_at: hoursAgo(2.7), duration_minutes: null })], NOW)).toHaveLength(0)
    expect(planCheckinSends([appointment({ scheduled_at: hoursAgo(2.8), duration_minutes: null })], NOW)).toHaveLength(2)
  })

  it("ignora sessões que não estão confirmed", () => {
    for (const status of ["pending", "cancelled", "completed"]) {
      expect(planCheckinSends([appointment({ status })], NOW)).toEqual([])
    }
  })

  it("ignora sessões que começaram há mais de 30 dias", () => {
    expect(planCheckinSends([appointment({ scheduled_at: daysAgo(31) })], NOW)).toEqual([])
  })

  it("não envia para quem não tem e-mail", () => {
    const sends = planCheckinSends([appointment({ mentor: { id: "mentor-1", full_name: "Marta", email: null } })], NOW)
    expect(sends).toEqual([{ kind: "initial", appointmentId: "appt-1", role: "mentee" }])
  })

  it("não reenvia o primeiro check-in se a linha já existe", () => {
    const sends = planCheckinSends(
      [appointment({ appointment_checkins: [row({ role: "mentor", sent_at: hoursAgo(1) })] })],
      NOW
    )
    expect(sends).toEqual([{ kind: "initial", appointmentId: "appt-1", role: "mentee" }])
  })

  it("lembra uma vez, 3 dias depois, quem não respondeu", () => {
    const sends = planCheckinSends(
      [appointment({ appointment_checkins: [row({ role: "mentor" }), row({ id: "chk-2", role: "mentee" })] })],
      NOW
    )
    expect(sends).toEqual([
      { kind: "reminder", appointmentId: "appt-1", role: "mentor", checkinId: "chk-1" },
      { kind: "reminder", appointmentId: "appt-1", role: "mentee", checkinId: "chk-2" }
    ])
  })

  it("não lembra antes de 3 dias, nem duas vezes, nem quem já respondeu", () => {
    const sends = planCheckinSends(
      [
        appointment({
          appointment_checkins: [
            row({ role: "mentor", sent_at: daysAgo(2) }),
            row({ id: "chk-2", role: "mentee", reminded_at: daysAgo(1) })
          ]
        }),
        appointment({ id: "appt-2", appointment_checkins: [row({ role: "mentor", outcome: "happened" }), row({ id: "chk-3", role: "mentee", outcome: "happened" })] })
      ],
      NOW
    )
    expect(sends).toEqual([])
  })

  it("não lembra resposta dada de dentro da plataforma (linha sem envio)", () => {
    const sends = planCheckinSends(
      [appointment({ appointment_checkins: [row({ role: "mentor", sent_at: null, token_hash: null, expires_at: null })] })],
      NOW
    )
    expect(sends).toEqual([{ kind: "initial", appointmentId: "appt-1", role: "mentee" }])
  })
})
