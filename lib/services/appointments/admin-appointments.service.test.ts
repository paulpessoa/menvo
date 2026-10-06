/**
 * @jest-environment node
 */
import {
  ADMIN_CANCELLER_NAME,
  ADMIN_LIST_LIMIT,
  AdminAppointmentError,
  cancelAppointmentAsAdmin,
  isPlaceholderName,
  listAdminAppointments,
  matchesSearch,
  resendConfirmation,
  resendMentorRequest,
  toAdminAppointment
} from "./admin-appointments.service"
import {
  sendAppointmentCancellation,
  sendAppointmentConfirmation,
  sendAppointmentRequest
} from "@/lib/email/brevo"
import {
  deleteCalendarEvent,
  isGoogleCalendarConfigured
} from "@/lib/services/mentorship/google-calendar.service"

jest.mock("@/lib/email/brevo", () => ({
  sendAppointmentRequest: jest.fn().mockResolvedValue(undefined),
  sendAppointmentConfirmation: jest.fn().mockResolvedValue(undefined),
  sendAppointmentCancellation: jest.fn().mockResolvedValue(undefined)
}))

jest.mock("@/lib/services/mentorship/google-calendar.service", () => ({
  deleteCalendarEvent: jest.fn().mockResolvedValue(true),
  isGoogleCalendarConfigured: jest.fn().mockReturnValue(true)
}))

const NOW = new Date("2026-10-01T12:00:00.000Z")
const FUTURE = "2026-10-07T16:00:00.000Z"
const PAST = "2026-09-20T16:00:00.000Z"
const APPT_ID = "11111111-1111-4111-8111-111111111111"
const ADMIN_ID = "admin-1"

const mentor = { id: "m1", full_name: "Bianca Dias", email: "bianca@example.com" }
const mentee = { id: "e1", full_name: "Maria Silva", email: "maria@example.com" }

function row(overrides: Record<string, any> = {}) {
  return {
    id: APPT_ID,
    status: "pending",
    scheduled_at: FUTURE,
    duration_minutes: 45,
    created_at: "2026-10-01T10:00:00.000Z",
    updated_at: "2026-10-01T10:00:00.000Z",
    topic: null,
    notes_mentee: "Quero orientação sobre transição de carreira para dados",
    message: null,
    notes_mentor: null,
    cancellation_reason: null,
    cancelled_at: null,
    cancelled_by: null,
    google_event_id: null,
    google_meet_link: null,
    google_calendar_link: null,
    token_expires_at: "2026-10-08T10:00:00.000Z",
    pending_reminder_sent_at: null,
    action_token: "token-abc",
    mentor,
    mentee,
    ...overrides
  }
}

/** Cliente Supabase falso: registra filtros/update e devolve resultados prontos. */
function makeClient(opts: {
  list?: any[]
  single?: any
  singleError?: any
  listError?: any
  update?: { data: any; error: any }
}) {
  const calls = { filters: [] as any[], updates: [] as any[], selects: [] as string[] }
  let mode: "read" | "update" = "read"
  const builder: any = {
    select: jest.fn((cols: string) => {
      calls.selects.push(cols)
      return builder
    }),
    order: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    eq: jest.fn((k: string, v: any) => {
      calls.filters.push(["eq", k, v])
      return builder
    }),
    in: jest.fn((k: string, v: any) => {
      calls.filters.push(["in", k, v])
      return builder
    }),
    update: jest.fn((payload: any) => {
      mode = "update"
      calls.updates.push(payload)
      return builder
    }),
    maybeSingle: jest.fn(async () => ({ data: opts.single ?? null, error: opts.singleError ?? null })),
    then: (resolve: any, reject: any) =>
      Promise.resolve(
        mode === "update"
          ? (opts.update ?? { data: [{ id: APPT_ID }], error: null })
          : { data: opts.list ?? [], error: opts.listError ?? null }
      ).then(resolve, reject)
  }
  return { client: { from: jest.fn(() => builder) } as any, calls }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(isGoogleCalendarConfigured as jest.Mock).mockReturnValue(true)
  ;(deleteCalendarEvent as jest.Mock).mockResolvedValue(true)
})

describe("isPlaceholderName", () => {
  it.each(["", "   ", null, undefined, "Usuário Teste", "usuario teste", "Usuário", "Teste", "test"])(
    "flags %p as incomplete",
    value => expect(isPlaceholderName(value as any)).toBe(true)
  )

  it.each(["Maria Silva", "Ana Souza", "Teste Silva Souza"])("keeps %p", value =>
    expect(isPlaceholderName(value)).toBe(false)
  )
})

describe("toAdminAppointment", () => {
  it("never exposes the confirmation token", () => {
    const result = toAdminAppointment(row() as any, NOW)
    expect(JSON.stringify(result)).not.toContain("token-abc")
    expect(result).not.toHaveProperty("action_token")
  })

  it("flags a pending request waiting 48h+ as stale", () => {
    const result = toAdminAppointment(row({ created_at: "2026-09-28T12:00:00.000Z" }) as any, NOW)
    expect(result.flags.waitingHours).toBe(72)
    expect(result.flags.stale).toBe(true)
    expect(result.flags.awaitingMentor).toBe(true)
  })

  it("does not flag a recent pending request", () => {
    const result = toAdminAppointment(row() as any, NOW)
    expect(result.flags.stale).toBe(false)
    expect(result.flags.waitingHours).toBe(2)
  })

  it("detects an expired confirmation link and a passed session", () => {
    const result = toAdminAppointment(
      row({ token_expires_at: "2026-09-30T00:00:00.000Z", scheduled_at: PAST }) as any,
      NOW
    )
    expect(result.flags.tokenExpired).toBe(true)
    expect(result.flags.sessionPassed).toBe(true)
    expect(result.actions.resendMentorRequest).toBe(false)
  })

  it("reports a missing reason and falls back to the legacy `message` column", () => {
    expect(toAdminAppointment(row({ notes_mentee: "", message: null }) as any, NOW).flags.missingReason).toBe(true)
    const legacy = toAdminAppointment(row({ notes_mentee: null, message: "  texto antigo  " }) as any, NOW)
    expect(legacy.reason).toBe("texto antigo")
    expect(legacy.flags.missingReason).toBe(false)
  })

  it("marks a mentee with a placeholder name", () => {
    const result = toAdminAppointment(row({ mentee: { ...mentee, full_name: "Usuário Teste" } }) as any, NOW)
    expect(result.mentee.nameIncomplete).toBe(true)
    expect(result.mentor.nameIncomplete).toBe(false)
  })

  it("labels a system-expired cancellation differently from a manual one", () => {
    const expired = toAdminAppointment(
      row({ status: "cancelled", cancelled_by: null, cancellation_reason: "Pedido expirado: o mentor não respondeu antes do horário." }) as any,
      NOW
    )
    expect(expired.statusLabel).toBe("Expirada")
    expect(expired.cancelledBy).toBe("system")

    const manual = toAdminAppointment(
      row({ status: "cancelled", cancelled_by: "u1", cancellation_reason: "Conflito de agenda" }) as any,
      NOW
    )
    expect(manual.statusLabel).toBe("Cancelada")
    expect(manual.cancelledBy).toBe("user")
  })

  it("only allows actions valid for the status", () => {
    const pending = toAdminAppointment(row() as any, NOW).actions
    expect(pending).toEqual({ resendMentorRequest: true, resendConfirmation: false, cancel: true })

    const confirmed = toAdminAppointment(row({ status: "confirmed" }) as any, NOW).actions
    expect(confirmed).toEqual({ resendMentorRequest: false, resendConfirmation: true, cancel: true })

    const completed = toAdminAppointment(row({ status: "completed", scheduled_at: PAST }) as any, NOW).actions
    expect(completed).toEqual({ resendMentorRequest: false, resendConfirmation: false, cancel: false })
  })

  it("accepts PostgREST embeds returned as arrays", () => {
    const result = toAdminAppointment(row({ mentor: [mentor], mentee: [mentee] }) as any, NOW)
    expect(result.mentor.name).toBe("Bianca Dias")
    expect(result.mentee.email).toBe("maria@example.com")
  })
})

describe("matchesSearch", () => {
  const appt = toAdminAppointment(row() as any, NOW)

  it("matches names ignoring accents and case, plus e-mail and reason", () => {
    expect(matchesSearch(appt, "BIANCA")).toBe(true)
    expect(matchesSearch(appt, "orientacao")).toBe(true)
    expect(matchesSearch(appt, "maria@example")).toBe(true)
  })

  it("returns everything for an empty query and nothing for a miss", () => {
    expect(matchesSearch(appt, "   ")).toBe(true)
    expect(matchesSearch(appt, "zzz-inexistente")).toBe(false)
  })
})

describe("listAdminAppointments", () => {
  const list = [
    row({ id: "a", status: "pending" }),
    row({ id: "b", status: "confirmed", mentee: { ...mentee, full_name: "João Pereira", email: "joao@example.com" } }),
    row({ id: "c", status: "confirmed" }),
    row({ id: "d", status: "cancelled", cancelled_by: "u1" })
  ]

  it("counts every status from all rows, even when filtering", async () => {
    const { client } = makeClient({ list })
    const result = await listAdminAppointments(client, { status: "confirmed", now: NOW })

    expect(result.counts).toEqual({ all: 4, pending: 1, confirmed: 2, cancelled: 1 })
    expect(result.appointments.map(a => a.id)).toEqual(["b", "c"])
    expect(result.total).toBe(2)
  })

  it("filters by search text and treats status=all as no filter", async () => {
    const { client } = makeClient({ list })
    const result = await listAdminAppointments(client, { status: "all", q: "joao", now: NOW })
    expect(result.appointments.map(a => a.id)).toEqual(["b"])
  })

  it("flags a truncated list when the row cap is reached", async () => {
    const big = Array.from({ length: ADMIN_LIST_LIMIT }, (_, i) => row({ id: `id-${i}` }))
    const { client } = makeClient({ list: big })
    expect((await listAdminAppointments(client, { now: NOW })).truncated).toBe(true)
  })

  it("never asks the database for the confirmation token", async () => {
    const { client, calls } = makeClient({ list })
    await listAdminAppointments(client, { now: NOW })
    expect(calls.selects.join(" ")).not.toContain("action_token")
  })

  it("throws a 500 AdminAppointmentError when the query fails", async () => {
    const { client } = makeClient({ listError: { message: "boom" } })
    await expect(listAdminAppointments(client)).rejects.toMatchObject({ status: 500, code: "QUERY_FAILED" })
  })
})

describe("resendMentorRequest", () => {
  it("reuses a still-valid link and e-mails the mentor with the mentee reason", async () => {
    const { client, calls } = makeClient({ single: row() })
    const result = await resendMentorRequest(client, APPT_ID, NOW)

    expect(result).toEqual({ sentTo: "bianca@example.com", tokenRenewed: false })
    expect(calls.updates).toHaveLength(0)
    expect(sendAppointmentRequest).toHaveBeenCalledWith({
      mentorEmail: "bianca@example.com",
      mentorName: "Bianca Dias",
      menteeName: "Maria Silva",
      scheduledAt: FUTURE,
      message: "Quero orientação sobre transição de carreira para dados",
      token: "token-abc"
    })
  })

  it("issues a fresh 7-day link when the old one expired", async () => {
    const { client, calls } = makeClient({ single: row({ token_expires_at: "2026-09-30T00:00:00.000Z" }) })
    const result = await resendMentorRequest(client, APPT_ID, NOW)

    expect(result.tokenRenewed).toBe(true)
    const update = calls.updates[0]
    expect(update.action_token).toEqual(expect.any(String))
    expect(update.action_token).not.toBe("token-abc")
    expect(update.token_expires_at).toBe("2026-10-08T12:00:00.000Z")
    expect(calls.filters).toContainEqual(["eq", "status", "pending"])
    expect((sendAppointmentRequest as jest.Mock).mock.calls[0][0].token).toBe(update.action_token)
  })

  it("issues a link when the row has none", async () => {
    const { client } = makeClient({ single: row({ action_token: null, token_expires_at: null }) })
    expect((await resendMentorRequest(client, APPT_ID, NOW)).tokenRenewed).toBe(true)
  })

  it("does not send the e-mail if the new link could not be saved", async () => {
    const { client } = makeClient({
      single: row({ token_expires_at: null }),
      update: { data: null, error: { message: "db down" } }
    })
    await expect(resendMentorRequest(client, APPT_ID, NOW)).rejects.toMatchObject({ code: "UPDATE_FAILED" })
    expect(sendAppointmentRequest).not.toHaveBeenCalled()
  })

  it("refuses when the status changed under us (race)", async () => {
    const { client } = makeClient({ single: row({ token_expires_at: null }), update: { data: [], error: null } })
    await expect(resendMentorRequest(client, APPT_ID, NOW)).rejects.toMatchObject({ status: 409, code: "STATUS_CHANGED" })
    expect(sendAppointmentRequest).not.toHaveBeenCalled()
  })

  it("uses a placeholder for legacy requests that have no reason", async () => {
    const { client } = makeClient({ single: row({ notes_mentee: "", message: null }) })
    await resendMentorRequest(client, APPT_ID, NOW)
    expect((sendAppointmentRequest as jest.Mock).mock.calls[0][0].message).toBe("O mentorado não deixou uma mensagem.")
  })

  it.each([
    ["confirmed", {}, 409, "INVALID_STATUS"],
    ["cancelled", {}, 409, "INVALID_STATUS"],
    ["pending but past", { scheduled_at: PAST }, 409, "SESSION_PASSED"],
    ["mentor without e-mail", { mentor: { ...mentor, email: null } }, 422, "NO_RECIPIENT"]
  ])("rejects %s", async (label, overrides, status, code) => {
    const extra = label === "confirmed" ? { status: "confirmed" } : label === "cancelled" ? { status: "cancelled" } : {}
    const { client } = makeClient({ single: row({ ...extra, ...overrides }) })
    await expect(resendMentorRequest(client, APPT_ID, NOW)).rejects.toMatchObject({ status, code })
    expect(sendAppointmentRequest).not.toHaveBeenCalled()
  })

  it("returns 404 for an unknown appointment", async () => {
    const { client } = makeClient({ single: null })
    await expect(resendMentorRequest(client, APPT_ID, NOW)).rejects.toMatchObject({ status: 404, code: "NOT_FOUND" })
  })
})

describe("resendConfirmation", () => {
  const confirmed = (extra = {}) =>
    row({ status: "confirmed", google_meet_link: "https://meet.google.com/abc", google_calendar_link: "https://cal/x", ...extra })

  it("re-sends the confirmation with meet and calendar links to both people", async () => {
    const { client } = makeClient({ single: confirmed({ notes_mentor: "Até lá!" }) })
    const result = await resendConfirmation(client, APPT_ID, NOW)

    expect(result.sentTo).toEqual(["bianca@example.com", "maria@example.com"])
    expect(sendAppointmentConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({
        mentorEmail: "bianca@example.com",
        menteeEmail: "maria@example.com",
        meetLink: "https://meet.google.com/abc",
        calendarLink: "https://cal/x",
        mentorNotes: "Até lá!"
      })
    )
  })

  it.each([
    ["pending", { status: "pending" }, "INVALID_STATUS"],
    ["session already passed", { scheduled_at: PAST }, "SESSION_PASSED"]
  ])("rejects %s", async (_label, overrides, code) => {
    const { client } = makeClient({ single: confirmed(overrides) })
    await expect(resendConfirmation(client, APPT_ID, NOW)).rejects.toMatchObject({ status: 409, code })
    expect(sendAppointmentConfirmation).not.toHaveBeenCalled()
  })

  it("requires both e-mails", async () => {
    const { client } = makeClient({ single: confirmed({ mentee: { ...mentee, email: null } }) })
    await expect(resendConfirmation(client, APPT_ID, NOW)).rejects.toMatchObject({ status: 422, code: "NO_RECIPIENT" })
  })
})

describe("cancelAppointmentAsAdmin", () => {
  it("cancels, records who did it, and e-mails BOTH people as the team", async () => {
    const { client, calls } = makeClient({ single: row() })
    const result = await cancelAppointmentAsAdmin(client, APPT_ID, ADMIN_ID, "Pedido duplicado do mesmo horário", NOW)

    expect(calls.updates[0]).toMatchObject({
      status: "cancelled",
      cancellation_reason: "Pedido duplicado do mesmo horário",
      cancelled_by: ADMIN_ID,
      cancelled_at: NOW.toISOString()
    })
    expect(calls.filters).toContainEqual(["in", "status", ["pending", "confirmed"]])

    expect(sendAppointmentCancellation).toHaveBeenCalledTimes(2)
    expect(sendAppointmentCancellation).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: "bianca@example.com",
        otherPersonName: "Maria Silva",
        cancelledByName: ADMIN_CANCELLER_NAME,
        reason: "Pedido duplicado do mesmo horário"
      })
    )
    expect(sendAppointmentCancellation).toHaveBeenCalledWith(
      expect.objectContaining({ recipientEmail: "maria@example.com", otherPersonName: "Bianca Dias" })
    )
    expect(result.notified).toEqual({ mentor: true, mentee: true })
    expect(result.calendarEventRemoved).toBeNull()
  })

  it("removes the Google Calendar event so the invite disappears", async () => {
    const { client } = makeClient({ single: row({ status: "confirmed", google_event_id: "evt-1" }) })
    const result = await cancelAppointmentAsAdmin(client, APPT_ID, ADMIN_ID, "Motivo de teste válido", NOW)

    expect(deleteCalendarEvent).toHaveBeenCalledWith(ADMIN_ID, "evt-1")
    expect(result.calendarEventRemoved).toBe(true)
  })

  it("keeps the cancellation and reports it when the calendar call fails", async () => {
    ;(deleteCalendarEvent as jest.Mock).mockRejectedValue(new Error("google down"))
    const { client } = makeClient({ single: row({ status: "confirmed", google_event_id: "evt-1" }) })
    const result = await cancelAppointmentAsAdmin(client, APPT_ID, ADMIN_ID, "Motivo de teste válido", NOW)

    expect(result.calendarEventRemoved).toBe(false)
    expect(sendAppointmentCancellation).toHaveBeenCalledTimes(2)
  })

  it("skips the calendar when Google is not configured", async () => {
    ;(isGoogleCalendarConfigured as jest.Mock).mockReturnValue(false)
    const { client } = makeClient({ single: row({ status: "confirmed", google_event_id: "evt-1" }) })
    const result = await cancelAppointmentAsAdmin(client, APPT_ID, ADMIN_ID, "Motivo de teste válido", NOW)

    expect(deleteCalendarEvent).not.toHaveBeenCalled()
    expect(result.calendarEventRemoved).toBeNull()
  })

  it("reports a failed e-mail without undoing the cancellation", async () => {
    ;(sendAppointmentCancellation as jest.Mock).mockRejectedValueOnce(new Error("smtp")).mockResolvedValueOnce(undefined)
    const { client } = makeClient({ single: row() })
    const result = await cancelAppointmentAsAdmin(client, APPT_ID, ADMIN_ID, "Motivo de teste válido", NOW)

    expect(result.notified).toEqual({ mentor: false, mentee: true })
  })

  it("does not notify anyone if the status changed before the update (race)", async () => {
    const { client } = makeClient({ single: row(), update: { data: [], error: null } })
    await expect(
      cancelAppointmentAsAdmin(client, APPT_ID, ADMIN_ID, "Motivo de teste válido", NOW)
    ).rejects.toMatchObject({ status: 409, code: "STATUS_CHANGED" })
    expect(sendAppointmentCancellation).not.toHaveBeenCalled()
    expect(deleteCalendarEvent).not.toHaveBeenCalled()
  })

  it.each(["cancelled", "completed", "rejected"])("refuses to cancel a %s session", async status => {
    const { client, calls } = makeClient({ single: row({ status }) })
    await expect(
      cancelAppointmentAsAdmin(client, APPT_ID, ADMIN_ID, "Motivo de teste válido", NOW)
    ).rejects.toMatchObject({ status: 409, code: "INVALID_STATUS" })
    expect(calls.updates).toHaveLength(0)
  })

  it("surfaces update errors as 500", async () => {
    const { client } = makeClient({ single: row(), update: { data: null, error: { message: "db" } } })
    await expect(
      cancelAppointmentAsAdmin(client, APPT_ID, ADMIN_ID, "Motivo de teste válido", NOW)
    ).rejects.toBeInstanceOf(AdminAppointmentError)
  })
})
