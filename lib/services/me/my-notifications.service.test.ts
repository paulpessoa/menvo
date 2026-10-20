import type { NotificationAppointment } from "@/lib/domain/profile/notification.entity"
import { createMyNotificationsService } from "./my-notifications.service"

const NOW = new Date("2026-10-19T12:00:00.000Z")

const completed: NotificationAppointment = {
  id: "a1",
  mentor_id: "other",
  mentee_id: "me",
  scheduled_at: "2026-10-10T12:00:00.000Z",
  status: "completed",
  notes_mentor: null,
  created_at: "2026-10-01T12:00:00.000Z",
  updated_at: "2026-10-10T13:00:00.000Z",
  mentor: { full_name: "Marta" },
  mentee: null,
}

const repo = () => ({
  listRecentAppointments: jest.fn(async () => [completed]),
  listReviewedAppointmentIds: jest.fn(async () => [] as string[]),
})

describe("my notifications service", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => undefined)
  })

  it("builds the notifications from the repository data", async () => {
    const list = await createMyNotificationsService({ repo: repo(), now: () => NOW }).list("me", "mentee")
    expect(list.map(n => n.type)).toEqual(["pending_evaluation"])
  })

  it("skips already reviewed sessions", async () => {
    const r = repo()
    r.listReviewedAppointmentIds.mockResolvedValue(["a1"])
    expect(await createMyNotificationsService({ repo: r, now: () => NOW }).list("me", null)).toEqual([])
  })

  it("does not fetch reviews for the mentor role", async () => {
    const r = repo()
    await createMyNotificationsService({ repo: r, now: () => NOW }).list("me", "mentor")
    expect(r.listReviewedAppointmentIds).not.toHaveBeenCalled()
  })

  it("a failing review lookup keeps the other notifications", async () => {
    const r = repo()
    r.listReviewedAppointmentIds.mockRejectedValue(new Error("boom"))
    const list = await createMyNotificationsService({ repo: r, now: () => NOW }).list("me", "mentee")
    expect(list).toHaveLength(1)
  })

  it("returns an empty list, and logs, when the appointments query fails", async () => {
    const r = repo()
    r.listRecentAppointments.mockRejectedValue(new Error("db down"))
    expect(await createMyNotificationsService({ repo: r, now: () => NOW }).list("me", "mentee")).toEqual([])
    expect(console.error).toHaveBeenCalled()
  })
})
