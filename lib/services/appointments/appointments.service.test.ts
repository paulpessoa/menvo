/**
 * @jest-environment node
 */
import type { Appointment, AppointmentWithParties } from "@/lib/domain/appointments/appointment.entity"
import type { AppointmentsRepository } from "@/lib/repositories/appointments.repository"
import type { AppointmentFeedbacksRepository } from "@/lib/repositories/appointment-feedbacks.repository"
import { RepositoryError } from "@/lib/repositories/repository-error"
import type { AppointmentMailer } from "@/lib/ports/appointment-mailer"
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
    transitionStatus: jest.fn(async () => {
      if (opts.transition instanceof Error) throw opts.transition
      return opts.transition === undefined ? base({ status: "completed" }) : opts.transition
    }),
  } as unknown as jest.Mocked<AppointmentsRepository>
  const feedbacks = { deleteByAppointment: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AppointmentFeedbacksRepository>
  const mailer: jest.Mocked<AppointmentMailer> = { sendCancellation: jest.fn().mockResolvedValue(undefined) }
  const service = createAppointmentsService({ repo, feedbacks, mailer, now: () => NOW })
  return { service, repo, feedbacks, mailer }
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
