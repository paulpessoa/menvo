import type { AvailabilityAlert } from "@/lib/domain/mentors/availability-alert.entity"
import type { MentorAvailabilityAlertRepository } from "@/lib/repositories/mentor-availability-alert.repository"
import { createAvailabilityAlertService } from "./availability-alert.service"

function createInMemoryRepo(seed: AvailabilityAlert[] = []) {
  const rows = [...seed]
  let failNext = false
  const repo: MentorAvailabilityAlertRepository = {
    async subscribe(alert) {
      if (failNext) throw new Error("db failure")
      const row: AvailabilityAlert = {
        id: `alert-${rows.length + 1}`,
        mentor_id: alert.mentor_id,
        mentee_id: alert.mentee_id ?? null,
        email: alert.email,
        created_at: new Date().toISOString(),
        notified_at: null,
      }
      rows.push(row)
      return row
    },
    async hasActiveAlert(mentorId, menteeId) {
      if (failNext) throw new Error("db failure")
      return rows.some((r) => r.mentor_id === mentorId && r.mentee_id === menteeId && !r.notified_at)
    },
    async listPendingByMentor(mentorId) {
      if (failNext) throw new Error("db failure")
      return rows.filter((r) => r.mentor_id === mentorId && !r.notified_at)
    },
    async markNotified(alertIds) {
      if (failNext) throw new Error("db failure")
      rows.forEach((r) => {
        if (alertIds.includes(r.id)) r.notified_at = new Date().toISOString()
      })
    },
  }
  return { repo, rows, fail: () => (failNext = true) }
}

describe("availability alert service", () => {
  it("subscribes valid email", async () => {
    const { repo } = createInMemoryRepo()
    const service = createAvailabilityAlertService({ repo })

    const res = await service.subscribe({
      mentor_id: "m1",
      mentee_id: "u1",
      email: "User@example.com",
    })

    expect(res.kind).toBe("subscribed")
    if (res.kind === "subscribed") {
      expect(res.alert.email).toBe("user@example.com")
      expect(res.alert.mentor_id).toBe("m1")
    }
  })

  it("rejects invalid email with kind: invalid_email", async () => {
    const { repo } = createInMemoryRepo()
    const service = createAvailabilityAlertService({ repo })

    const res = await service.subscribe({
      mentor_id: "m1",
      email: "not-an-email",
    })

    expect(res.kind).toBe("invalid_email")
  })

  it("notifies pending subscribers when mentor opens slots", async () => {
    const seed: AvailabilityAlert = {
      id: "alert-1",
      mentor_id: "m1",
      mentee_id: "u1",
      email: "subscriber@example.com",
      created_at: "",
      notified_at: null,
    }
    const { repo, rows } = createInMemoryRepo([seed])
    const sendEmail = jest.fn().mockResolvedValue(undefined)
    const getMentorInfo = jest.fn().mockResolvedValue({
      full_name: "Ana Silva",
      slug: "ana-silva",
      avatar_url: "https://avatar.com/ana.jpg",
      job_title: "Tech Lead",
      company: "Google",
    })

    const service = createAvailabilityAlertService({ repo, sendEmail, getMentorInfo })
    const outcome = await service.notifySubscribers("m1")

    expect(outcome.notified).toBe(1)
    expect(sendEmail).toHaveBeenCalledWith({
      menteeEmail: "subscriber@example.com",
      mentorName: "Ana Silva",
      mentorSlug: "ana-silva",
      mentorJobTitle: "Tech Lead",
      mentorCompany: "Google",
      mentorAvatarUrl: "https://avatar.com/ana.jpg",
    })
    expect(rows[0].notified_at).toBeTruthy()
  })

  it("handles empty subscribers without sending emails", async () => {
    const { repo } = createInMemoryRepo()
    const sendEmail = jest.fn()
    const service = createAvailabilityAlertService({ repo, sendEmail })

    const outcome = await service.notifySubscribers("m1")
    expect(outcome.notified).toBe(0)
    expect(sendEmail).not.toHaveBeenCalled()
  })
})
