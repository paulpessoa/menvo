/**
 * @jest-environment node
 */
import type { Appointment, AppointmentWithParties } from "@/lib/domain/appointments/appointment.entity"
import type { AppointmentsRepository } from "@/lib/repositories/appointments.repository"
import type { AppointmentFeedbacksRepository } from "@/lib/repositories/appointment-feedbacks.repository"
import { RepositoryError } from "@/lib/repositories/repository-error"
import type { AppointmentMailer } from "@/lib/ports/appointment-mailer"
import type { AppointmentCalendar } from "@/lib/ports/appointment-calendar"
import { createAppointmentsService } from "./appointments.service"

const NOW = new Date("2026-10-20T12:00:00.000Z")
const PAST = "2026-10-19T10:00:00.000Z"
const FUTURE = "2026-10-21T10:00:00.000Z"

const base = (over: Partial<Appointment> = {}): Appointment =>
  ({
    id: "apt-1",
    mentor_id: "mentor-1",
    mentee_id: "mentee-1",
    scheduled_at: PAST,
    duration_minutes: 45,
    status: "confirmed",
    ...over,
  }) as Appointment

const withParties = (over: Partial<Appointment> = {}): AppointmentWithParties => ({
  ...base(over),
  mentor: { id: "mentor-1", full_name: "Mentor Joe", email: "mentor@test.com", avatar_url: null, linkedin_url: null },
  mentee: { id: "mentee-1", full_name: "Mentee Sam", email: "mentee@test.com", avatar_url: null, linkedin_url: null },
})

function setup(opts: { found?: Appointment | AppointmentWithParties | null; transition?: Appointment | null | Error } = {}) {
  const found = opts.found === undefined ? withParties() : opts.found
  const repo = {
    findById: jest.fn().mockResolvedValue(found),
    findWithParties: jest.fn().mockResolvedValue(found),
    findWithPartiesByActionToken: jest.fn().mockResolvedValue(found),
    setFields: jest.fn().mockResolvedValue(undefined),
    transitionStatus: jest.fn(async () => {
      if (opts.transition instanceof Error) throw opts.transition
      return opts.transition === undefined ? base({ status: "completed" }) : opts.transition
    }),
  } as unknown as jest.Mocked<AppointmentsRepository>
  const feedbacks = {
    deleteByAppointment: jest.fn().mockResolvedValue(undefined),
    findByReviewer: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockResolvedValue(undefined),
    listForUser: jest.fn().mockResolvedValue([]),
    findOwner: jest.fn().mockResolvedValue({ id: "f1", reviewer_id: "mentee-1" }),
    updatePublicFeedback: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AppointmentFeedbacksRepository>
  const mailer: jest.Mocked<AppointmentMailer> = {
    sendCancellation: jest.fn().mockResolvedValue(undefined),
    sendConfirmation: jest.fn().mockResolvedValue(undefined),
  }
  const calendar: jest.Mocked<AppointmentCalendar> = {
    availability: jest.fn().mockResolvedValue({ configured: false, missing: [] }),
    createEvent: jest.fn().mockResolvedValue({ eventId: "evt-9", meetLink: "https://meet/x", calendarLink: "https://cal/x" }),
    deleteEvent: jest.fn().mockResolvedValue(undefined),
  }
  // Aqui as duas "pontas" são os mesmos mocks; "client split" abaixo separa e prova quem usa qual.
  const service = createAppointmentsService({ repo, feedbacks, admin: () => ({ repo, feedbacks }), mailer, calendar, now: () => NOW })
  return { service, repo, feedbacks, mailer, calendar }
}

beforeEach(() => jest.spyOn(console, "error").mockImplementation(() => {}))
afterEach(() => jest.restoreAllMocks())

describe("markCompleted", () => {
  it("completes a confirmed session for its mentor with a conditional update", async () => {
    const { service, repo } = setup()
    expect(await service.markCompleted("apt-1", "mentor-1")).toEqual({ kind: "ok" })
    expect(repo.transitionStatus).toHaveBeenCalledWith({
      id: "apt-1",
      from: "confirmed",
      to: "completed",
      patch: { completed_at: NOW.toISOString() },
    })
  })

  it("is not_found when the session does not exist", async () => {
    const { service, repo } = setup({ found: null })
    expect(await service.markCompleted("x", "mentor-1")).toEqual({ kind: "not_found" })
    expect(repo.transitionStatus).not.toHaveBeenCalled()
  })

  it("refuses anyone who is not the mentor, the mentee included", async () => {
    for (const user of ["mentee-1", "intruder"]) {
      const { service, repo } = setup()
      expect(await service.markCompleted("apt-1", user)).toEqual({ kind: "forbidden" })
      expect(repo.transitionStatus).not.toHaveBeenCalled()
    }
  })

  it.each(["pending", "completed", "cancelled"] as const)("refuses a %s session", async (status) => {
    const { service, repo } = setup({ found: base({ status }) })
    expect(await service.markCompleted("apt-1", "mentor-1")).toEqual({ kind: "wrong_status" })
    expect(repo.transitionStatus).not.toHaveBeenCalled()
  })

  it("reports `changed` when someone else moved the status in between (lost the race)", async () => {
    const { service } = setup({ transition: null })
    expect(await service.markCompleted("apt-1", "mentor-1")).toEqual({ kind: "changed" })
  })

  it("turns the database guard rejection into invalid_transition", async () => {
    const guard = new RepositoryError("appointments.transitionStatus", {
      message: "appointment_invalid_transition: cancelled -> completed",
    })
    const { service } = setup({ transition: guard })
    expect(await service.markCompleted("apt-1", "mentor-1")).toMatchObject({ kind: "invalid_transition" })
  })

  it("lets an unrelated database error surface", async () => {
    const { service } = setup({ transition: new RepositoryError("appointments.transitionStatus", { message: "boom" }) })
    await expect(service.markCompleted("apt-1", "mentor-1")).rejects.toThrow("boom")
  })
})

describe("registerNoShow", () => {
  it("cancels a past confirmed session, clears feedback and tells the mentee", async () => {
    const { service, repo, feedbacks, mailer } = setup({ transition: base({ status: "cancelled" }) })
    const result = await service.registerNoShow("apt-1", "mentor-1", "Aguardei 15 minutos e não apareceu.")

    expect(result).toEqual({ kind: "ok" })
    expect(repo.transitionStatus).toHaveBeenCalledWith({
      id: "apt-1",
      from: "confirmed",
      to: "cancelled",
      patch: {
        cancellation_reason: "Mentorado não compareceu: Aguardei 15 minutos e não apareceu.",
        notes_mentor: "Aguardei 15 minutos e não apareceu.",
        cancelled_at: NOW.toISOString(),
        cancelled_by: "mentor-1",
        completed_at: null,
      },
    })
    expect(feedbacks.deleteByAppointment).toHaveBeenCalledWith("apt-1")
    expect(mailer.sendCancellation).toHaveBeenCalledWith({
      recipientEmail: "mentee@test.com",
      recipientName: "Mentee Sam",
      otherPersonName: "Mentor Joe",
      scheduledAt: PAST,
      reason: "Mentorado não compareceu: Aguardei 15 minutos e não apareceu.",
      cancelledByName: "Mentor Joe",
    })
  })

  it("uses the default reason and note when the mentor wrote none", async () => {
    const { service, repo } = setup({ transition: base({ status: "cancelled" }) })
    await service.registerNoShow("apt-1", "mentor-1", "   ")
    expect(repo.transitionStatus.mock.calls[0][0].patch).toMatchObject({
      cancellation_reason: "Mentorado não compareceu à sessão",
      notes_mentor: "Mentorado não compareceu à sessão.",
    })
  })

  it("also accepts a completed session (the mentor registers the absence afterwards)", async () => {
    const { service, repo } = setup({ found: withParties({ status: "completed" }), transition: base({ status: "cancelled" }) })
    expect(await service.registerNoShow("apt-1", "mentor-1")).toEqual({ kind: "ok" })
    expect(repo.transitionStatus.mock.calls[0][0].from).toBe("completed")
  })

  it("is not_found for a missing session", async () => {
    expect(await setup({ found: null }).service.registerNoShow("x", "mentor-1")).toEqual({ kind: "not_found" })
  })

  it("refuses anyone who is not the mentor", async () => {
    const { service, repo } = setup()
    expect(await service.registerNoShow("apt-1", "intruder")).toEqual({ kind: "forbidden" })
    expect(await service.registerNoShow("apt-1", "mentee-1")).toEqual({ kind: "forbidden" })
    expect(repo.transitionStatus).not.toHaveBeenCalled()
  })

  it("refuses a session that has not happened yet", async () => {
    const { service, repo } = setup({ found: withParties({ scheduled_at: FUTURE }) })
    expect(await service.registerNoShow("apt-1", "mentor-1")).toEqual({ kind: "in_future" })
    expect(repo.transitionStatus).not.toHaveBeenCalled()
  })

  it.each(["pending", "cancelled"] as const)("refuses a %s session", async (status) => {
    const { service } = setup({ found: withParties({ status }) })
    expect(await service.registerNoShow("apt-1", "mentor-1")).toEqual({ kind: "wrong_status" })
  })

  it("touches neither feedback nor e-mail when the transition is blocked", async () => {
    const { service, feedbacks, mailer } = setup({ transition: null })
    expect(await service.registerNoShow("apt-1", "mentor-1")).toEqual({ kind: "changed" })
    expect(feedbacks.deleteByAppointment).not.toHaveBeenCalled()
    expect(mailer.sendCancellation).not.toHaveBeenCalled()
  })

  it("still succeeds when the e-mail or the feedback cleanup fails", async () => {
    const { service, feedbacks, mailer } = setup({ transition: base({ status: "cancelled" }) })
    mailer.sendCancellation.mockRejectedValue(new Error("brevo down"))
    feedbacks.deleteByAppointment.mockRejectedValue(new Error("denied"))
    expect(await service.registerNoShow("apt-1", "mentor-1")).toEqual({ kind: "ok" })
  })

  it("does not e-mail a mentee without an address", async () => {
    const found = { ...withParties(), mentee: { id: "mentee-1", full_name: "Sam", email: null, avatar_url: null, linkedin_url: null } }
    const { service, mailer } = setup({ found, transition: base({ status: "cancelled" }) })
    expect(await service.registerNoShow("apt-1", "mentor-1")).toEqual({ kind: "ok" })
    expect(mailer.sendCancellation).not.toHaveBeenCalled()
  })
})

describe("cancel", () => {
  const cancelled = () => base({ status: "cancelled" })

  it("lets the mentor cancel, removes the calendar event and tells the mentee", async () => {
    const { service, repo, calendar, mailer } = setup({
      found: withParties({ status: "confirmed", google_event_id: "evt-1" }),
      transition: cancelled(),
    })
    expect(await service.cancel("apt-1", "mentor-1", "Imprevisto")).toEqual({ kind: "ok" })
    expect(repo.transitionStatus).toHaveBeenCalledWith({
      id: "apt-1",
      from: "confirmed",
      to: "cancelled",
      patch: { cancellation_reason: "Imprevisto", cancelled_at: NOW.toISOString(), cancelled_by: "mentor-1" },
    })
    expect(calendar.deleteEvent).toHaveBeenCalledWith("mentor-1", "evt-1")
    expect(mailer.sendCancellation).toHaveBeenCalledWith({
      recipientEmail: "mentee@test.com",
      recipientName: "Mentee Sam",
      otherPersonName: "Mentor Joe",
      scheduledAt: PAST,
      reason: "Imprevisto",
      cancelledByName: "Mentor Joe",
    })
  })

  it("lets the mentee cancel a pending request and tells the mentor", async () => {
    const { service, mailer, calendar } = setup({ found: withParties({ status: "pending" }), transition: cancelled() })
    expect(await service.cancel("apt-1", "mentee-1", "Mudei de ideia")).toEqual({ kind: "ok" })
    expect(calendar.deleteEvent).not.toHaveBeenCalled()
    expect(mailer.sendCancellation).toHaveBeenCalledWith(
      expect.objectContaining({ recipientEmail: "mentor@test.com", cancelledByName: "Mentee Sam", otherPersonName: "Mentee Sam" })
    )
  })

  // Regressão da falha corrigida no PR #109: a rota usa um client que ignora a RLS,
  // então "só quem participa cancela" tem de ser garantido aqui.
  it("answers not_found, without touching anything, to a user who is not a participant", async () => {
    const { service, repo, calendar, mailer } = setup()
    expect(await service.cancel("apt-1", "stranger-1", "Tentativa indevida")).toEqual({ kind: "not_found" })
    expect(repo.transitionStatus).not.toHaveBeenCalled()
    expect(calendar.deleteEvent).not.toHaveBeenCalled()
    expect(mailer.sendCancellation).not.toHaveBeenCalled()
  })

  it("is not_found for a missing session", async () => {
    expect(await setup({ found: null }).service.cancel("x", "mentor-1", "motivo")).toEqual({ kind: "not_found" })
  })

  it("reports an already cancelled session", async () => {
    const { service, repo } = setup({ found: withParties({ status: "cancelled" }) })
    expect(await service.cancel("apt-1", "mentor-1", "motivo")).toEqual({ kind: "already_cancelled" })
    expect(repo.transitionStatus).not.toHaveBeenCalled()
  })

  it("lets only the mentor undo a completed session; the mentee gets forbidden", async () => {
    const { service, repo } = setup({ found: withParties({ status: "completed" }), transition: cancelled() })
    expect(await service.cancel("apt-1", "mentee-1", "motivo")).toEqual({ kind: "forbidden" })
    expect(repo.transitionStatus).not.toHaveBeenCalled()
    expect(await service.cancel("apt-1", "mentor-1", "motivo")).toEqual({ kind: "ok" })
  })

  it("reports `changed` when the status moved in between, and sends nothing", async () => {
    const { service, mailer, calendar } = setup({ found: withParties({ google_event_id: "evt-1" }), transition: null })
    expect(await service.cancel("apt-1", "mentor-1", "motivo")).toEqual({ kind: "changed" })
    expect(calendar.deleteEvent).not.toHaveBeenCalled()
    expect(mailer.sendCancellation).not.toHaveBeenCalled()
  })

  it("turns the database guard rejection into invalid_transition", async () => {
    const guard = new RepositoryError("appointments.transitionStatus", { message: "appointment_transition_forbidden: confirmed -> cancelled" })
    expect(await setup({ transition: guard }).service.cancel("apt-1", "mentor-1", "motivo")).toMatchObject({ kind: "invalid_transition" })
  })

  it("keeps the cancellation when the calendar or the e-mail fails", async () => {
    const { service, calendar, mailer } = setup({ found: withParties({ google_event_id: "evt-1" }), transition: cancelled() })
    jest.spyOn(console, "warn").mockImplementation(() => {})
    calendar.deleteEvent.mockRejectedValue(new Error("google down"))
    mailer.sendCancellation.mockRejectedValue(new Error("brevo down"))
    expect(await service.cancel("apt-1", "mentor-1", "motivo")).toEqual({ kind: "ok" })
  })
})

describe("evaluate", () => {
  const input = { rating: 5, privateNotes: "nota", publicFeedback: "ótima" }

  it("completes a confirmed session and records the review for the mentor", async () => {
    const { service, repo, feedbacks } = setup()
    expect(await service.evaluate("apt-1", "mentee-1", input)).toEqual({ kind: "ok" })
    expect(repo.transitionStatus).toHaveBeenCalledWith({
      id: "apt-1",
      from: "confirmed",
      to: "completed",
      patch: { completed_at: NOW.toISOString() },
    })
    expect(feedbacks.insert).toHaveBeenCalledWith({
      appointment_id: "apt-1",
      reviewer_id: "mentee-1",
      reviewed_id: "mentor-1",
      rating: 5,
      private_notes: "nota",
      public_feedback: "ótima",
    })
  })

  it("stores null for empty notes and does not transition an already completed session", async () => {
    const { service, repo, feedbacks } = setup({ found: base({ status: "completed" }) })
    expect(await service.evaluate("apt-1", "mentee-1", { rating: 4, privateNotes: "", publicFeedback: null })).toEqual({ kind: "ok" })
    expect(repo.transitionStatus).not.toHaveBeenCalled()
    expect(feedbacks.insert).toHaveBeenCalledWith(expect.objectContaining({ private_notes: null, public_feedback: null }))
  })

  it("only the mentee reviews: the mentor and strangers are forbidden", async () => {
    for (const user of ["mentor-1", "intruder"]) {
      const { service, feedbacks } = setup()
      expect(await service.evaluate("apt-1", user, input)).toEqual({ kind: "forbidden" })
      expect(feedbacks.insert).not.toHaveBeenCalled()
    }
  })

  it("is not_found for a missing session", async () => {
    expect(await setup({ found: null }).service.evaluate("x", "mentee-1", input)).toEqual({ kind: "not_found" })
  })

  it.each(["pending", "cancelled"] as const)("refuses to review a %s session", async (status) => {
    const { service } = setup({ found: base({ status }) })
    expect(await service.evaluate("apt-1", "mentee-1", input)).toEqual({ kind: "wrong_status" })
  })

  it("refuses a second review by the same mentee, without changing status", async () => {
    const { service, repo, feedbacks } = setup()
    feedbacks.findByReviewer.mockResolvedValue({ id: "f1" })
    expect(await service.evaluate("apt-1", "mentee-1", input)).toEqual({ kind: "already_evaluated" })
    expect(repo.transitionStatus).not.toHaveBeenCalled()
    expect(feedbacks.insert).not.toHaveBeenCalled()
  })

  it("does not record a review when the status moved in between", async () => {
    const { service, feedbacks } = setup({ transition: null })
    expect(await service.evaluate("apt-1", "mentee-1", input)).toEqual({ kind: "changed" })
    expect(feedbacks.insert).not.toHaveBeenCalled()
  })

  it("reports feedback_failed when the insert fails, leaving the session reviewable again", async () => {
    const { service, feedbacks } = setup()
    feedbacks.insert.mockRejectedValue(new RepositoryError("appointmentFeedbacks.insert", { message: "denied" }))
    expect(await service.evaluate("apt-1", "mentee-1", input)).toEqual({ kind: "feedback_failed" })
  })
})

describe("confirm", () => {
  const pending = () => withParties({ status: "pending", duration_minutes: 45, notes_mentee: "Quero orientação" })
  const confirmed = () => base({ status: "confirmed" })

  it("confirms by token without any session, creates the event, saves the links and e-mails both sides", async () => {
    const { service, repo, calendar, mailer } = setup({ found: pending(), transition: confirmed() })
    calendar.availability.mockResolvedValue({ configured: true, missing: [] })

    const result = await service.confirm({ token: "secret", sessionUserId: null })

    expect(result).toEqual({ kind: "ok", googleEventId: "evt-9", googleMeetLink: "https://meet/x", calendarError: null })
    expect(repo.findWithPartiesByActionToken).toHaveBeenCalledWith("secret")
    expect(repo.transitionStatus).toHaveBeenCalledWith({ id: "apt-1", from: "pending", to: "confirmed", patch: undefined })
    expect(calendar.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({ mentorEmail: "mentor@test.com", menteeEmail: "mentee@test.com", endTime: new Date(new Date(PAST).getTime() + 45 * 60000) })
    )
    expect(repo.setFields).toHaveBeenCalledWith("apt-1", {
      google_event_id: "evt-9",
      google_meet_link: "https://meet/x",
      google_calendar_link: "https://cal/x",
    })
    expect(mailer.sendConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({ mentorEmail: "mentor@test.com", meetLink: "https://meet/x", calendarLink: "https://cal/x", menteeNotes: "Quero orientação" })
    )
  })

  it("the status change comes before the calendar event, so a lost race leaves no orphan event", async () => {
    const { service, calendar, mailer } = setup({ found: pending(), transition: null })
    calendar.availability.mockResolvedValue({ configured: true, missing: [] })
    expect(await service.confirm({ token: "secret", sessionUserId: null })).toEqual({ kind: "changed" })
    expect(calendar.createEvent).not.toHaveBeenCalled()
    expect(mailer.sendConfirmation).not.toHaveBeenCalled()
  })

  it("lets the session mentor confirm by id and stores the notes", async () => {
    const { service, repo } = setup({ found: pending(), transition: confirmed() })
    const result = await service.confirm({ appointmentId: "apt-1", mentorNotes: "Tudo certo", sessionUserId: "mentor-1" })
    expect(result.kind).toBe("ok")
    expect(repo.transitionStatus.mock.calls[0][0].patch).toEqual({ notes_mentor: "Tudo certo" })
  })

  it("refuses the id path without a session or for anyone but the mentor", async () => {
    for (const sessionUserId of [null, "attacker-1", "mentee-1"]) {
      const { service, repo, mailer } = setup({ found: pending(), transition: confirmed() })
      expect(await service.confirm({ appointmentId: "apt-1", sessionUserId })).toEqual({ kind: "forbidden" })
      expect(repo.transitionStatus).not.toHaveBeenCalled()
      expect(mailer.sendConfirmation).not.toHaveBeenCalled()
    }
  })

  it("is not_found for an unknown token or id", async () => {
    expect(await setup({ found: null }).service.confirm({ token: "nope", sessionUserId: null })).toEqual({ kind: "not_found" })
    expect(await setup({ found: null }).service.confirm({ sessionUserId: "mentor-1" })).toEqual({ kind: "not_found" })
  })

  it("answers already_confirmed for a repeated click and wrong_status for the rest", async () => {
    expect(await setup({ found: withParties({ status: "confirmed" }) }).service.confirm({ token: "t", sessionUserId: null })).toEqual({
      kind: "already_confirmed",
    })
    for (const status of ["completed", "cancelled"] as const) {
      const { service, repo } = setup({ found: withParties({ status }) })
      expect(await service.confirm({ token: "t", sessionUserId: null })).toEqual({ kind: "wrong_status", status })
      expect(repo.transitionStatus).not.toHaveBeenCalled()
    }
  })

  it("confirms anyway, reporting why, when the calendar is not configured or fails", async () => {
    const off = setup({ found: pending(), transition: confirmed() })
    off.calendar.availability.mockResolvedValue({ configured: false, missing: ["GOOGLE_CALENDAR_CLIENT_ID"] })
    jest.spyOn(console, "warn").mockImplementation(() => {})
    expect(await off.service.confirm({ token: "t", sessionUserId: null })).toEqual({
      kind: "ok",
      googleEventId: null,
      googleMeetLink: null,
      calendarError: "Google Calendar não configurado. Faltando: GOOGLE_CALENDAR_CLIENT_ID",
    })
    expect(off.mailer.sendConfirmation).toHaveBeenCalledWith(expect.objectContaining({ meetLink: null }))

    const broken = setup({ found: pending(), transition: confirmed() })
    broken.calendar.availability.mockResolvedValue({ configured: true, missing: [] })
    broken.calendar.createEvent.mockRejectedValue(new Error("google down"))
    expect(await broken.service.confirm({ token: "t", sessionUserId: null })).toMatchObject({ kind: "ok", calendarError: "google down" })
    expect(broken.repo.setFields).not.toHaveBeenCalled()
  })

  it("keeps the confirmation when saving the links or sending the e-mail fails", async () => {
    const { service, repo, calendar, mailer } = setup({ found: pending(), transition: confirmed() })
    calendar.availability.mockResolvedValue({ configured: true, missing: [] })
    repo.setFields.mockRejectedValue(new Error("db"))
    mailer.sendConfirmation.mockRejectedValue(new Error("brevo down"))
    expect(await service.confirm({ token: "t", sessionUserId: null })).toMatchObject({
      kind: "ok",
      googleEventId: "evt-9",
      calendarError: expect.stringContaining("não foi possível guardar"),
    })
  })

  it("turns the database guard rejection into invalid_transition", async () => {
    const guard = new RepositoryError("appointments.transitionStatus", { message: "appointment_invalid_transition: cancelled -> confirmed" })
    expect(await setup({ found: pending(), transition: guard }).service.confirm({ token: "t", sessionUserId: null })).toMatchObject({
      kind: "invalid_transition",
    })
  })
})

describe("feedbacks", () => {
  it("listFeedbacks delegates with the user and the direction", async () => {
    const { service, feedbacks } = setup()
    await service.listFeedbacks("mentee-1", "sent")
    expect(feedbacks.listForUser).toHaveBeenCalledWith({ userId: "mentee-1", type: "sent" })
  })

  it("lets the author edit their comment, which goes back to moderation", async () => {
    const { service, feedbacks } = setup()
    expect(await service.updateOwnFeedback("f1", "mentee-1", "novo texto")).toEqual({ kind: "ok" })
    expect(feedbacks.updatePublicFeedback).toHaveBeenCalledWith("f1", "novo texto")
  })

  it("refuses anyone else and an unknown feedback, without writing", async () => {
    const { service, feedbacks } = setup()
    expect(await service.updateOwnFeedback("f1", "intruder", "x")).toEqual({ kind: "forbidden" })
    feedbacks.findOwner.mockResolvedValue(null)
    expect(await service.updateOwnFeedback("nope", "mentee-1", "x")).toEqual({ kind: "not_found" })
    expect(feedbacks.updatePublicFeedback).not.toHaveBeenCalled()
  })
})

// ADR 0008 §4: concluir, avaliar e a escrita do cancelar usam a SESSÃO; o privilégio
// fica só para o contato da outra parte e para o que ainda não tem policy.
describe("client split (session x admin)", () => {
  function split(found: AppointmentWithParties | Appointment | null) {
    const mk = (label: string) =>
      ({
        label,
        findById: jest.fn().mockResolvedValue(found),
        findWithParties: jest.fn().mockResolvedValue(found),
        findWithPartiesByActionToken: jest.fn().mockResolvedValue(found),
        listForUser: jest.fn().mockResolvedValue([]),
        setFields: jest.fn().mockResolvedValue(undefined),
        transitionStatus: jest.fn().mockResolvedValue(base({ status: "cancelled" })),
      }) as unknown as jest.Mocked<AppointmentsRepository>
    const mkFb = () =>
      ({
        findByReviewer: jest.fn().mockResolvedValue(null),
        insert: jest.fn().mockResolvedValue(undefined),
        deleteByAppointment: jest.fn().mockResolvedValue(undefined),
        listForUser: jest.fn().mockResolvedValue([]),
        findOwner: jest.fn().mockResolvedValue({ id: "f1", reviewer_id: "mentee-1" }),
        updatePublicFeedback: jest.fn().mockResolvedValue(undefined),
      }) as unknown as jest.Mocked<AppointmentFeedbacksRepository>
    const session = { repo: mk("session"), feedbacks: mkFb() }
    const adminPair = { repo: mk("admin"), feedbacks: mkFb() }
    const admin = jest.fn(() => adminPair)
    const service = createAppointmentsService({
      repo: session.repo,
      feedbacks: session.feedbacks,
      admin,
      mailer: { sendCancellation: jest.fn().mockResolvedValue(undefined), sendConfirmation: jest.fn().mockResolvedValue(undefined) },
      calendar: {
        availability: jest.fn().mockResolvedValue({ configured: false, missing: [] }),
        createEvent: jest.fn(),
        deleteEvent: jest.fn().mockResolvedValue(undefined),
      },
      now: () => NOW,
    })
    return { service, session, adminPair, admin }
  }

  it("markCompleted and evaluate never ask for the privileged client", async () => {
    const { service, session, admin } = split(base())
    await service.markCompleted("apt-1", "mentor-1")
    await service.evaluate("apt-1", "mentee-1", { rating: 5 })
    expect(admin).not.toHaveBeenCalled()
    expect(session.repo.transitionStatus).toHaveBeenCalledTimes(2)
    expect(session.feedbacks.insert).toHaveBeenCalledTimes(1)
  })

  it("cancel reads the parties with the privileged client but writes the status with the session", async () => {
    const { service, session, adminPair } = split(withParties({ status: "confirmed" }))
    expect(await service.cancel("apt-1", "mentor-1", "motivo")).toEqual({ kind: "ok" })
    expect(adminPair.repo.findWithParties).toHaveBeenCalledWith("apt-1")
    expect(adminPair.repo.transitionStatus).not.toHaveBeenCalled()
    expect(session.repo.transitionStatus).toHaveBeenCalledTimes(1)
  })

  it("cancel does not write anything when the reader is not a participant", async () => {
    const { service, session, adminPair } = split(withParties({ status: "confirmed" }))
    expect(await service.cancel("apt-1", "stranger", "motivo")).toEqual({ kind: "not_found" })
    expect(session.repo.transitionStatus).not.toHaveBeenCalled()
    expect(adminPair.repo.transitionStatus).not.toHaveBeenCalled()
  })

  it("no-show, list and feedback edits stay on the privileged client (confirm too, covered above)", async () => {
    const { service, session, adminPair } = split(withParties({ status: "confirmed" }))
    await service.registerNoShow("apt-1", "mentor-1")
    await service.listMine({ userId: "mentor-1", limit: 10 })
    await service.updateOwnFeedback("f1", "mentee-1", "x")
    expect(adminPair.repo.transitionStatus).toHaveBeenCalled()
    expect(adminPair.feedbacks.deleteByAppointment).toHaveBeenCalled()
    expect(adminPair.repo.listForUser).toHaveBeenCalled()
    expect(adminPair.feedbacks.updatePublicFeedback).toHaveBeenCalled()
    expect(session.repo.transitionStatus).not.toHaveBeenCalled()
    expect(session.feedbacks.updatePublicFeedback).not.toHaveBeenCalled()
  })
})

describe("listMine", () => {
  it("delegates to the repository with the user and the filters", async () => {
    const { service, repo } = setup()
    const items = [{ id: "apt-1" }] as never
    ;(repo as unknown as { listForUser: jest.Mock }).listForUser = jest.fn().mockResolvedValue(items)
    expect(await service.listMine({ userId: "mentor-1", role: "mentor", status: "pending", limit: 10 })).toBe(items)
    expect((repo as unknown as { listForUser: jest.Mock }).listForUser).toHaveBeenCalledWith({
      userId: "mentor-1",
      role: "mentor",
      status: "pending",
      limit: 10,
    })
  })
})
