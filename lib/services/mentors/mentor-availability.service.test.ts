import type { AvailabilitySlot, NewAvailabilitySlot } from "@/lib/domain/mentors/availability.entity"
import type { MentorAvailabilityRepository } from "@/lib/repositories/mentor-availability.repository"
import { createMentorAvailabilityService } from "./mentor-availability.service"

/** Fake em memória: implementa a interface do repository, sem banco. */
function createInMemoryRepo(seed: AvailabilitySlot[] = []) {
  const rows = [...seed]
  const calls: { slots: NewAvailabilitySlot[]; timezone: string | null }[] = []
  let failNext = false
  const repo: MentorAvailabilityRepository = {
    async listByMentor(mentorId) {
      if (failNext) throw new Error("db down")
      return rows.filter((r) => r.mentor_id === mentorId)
    },
    async replaceOwn(slots, timezone) {
      if (failNext) throw new Error("db down")
      calls.push({ slots, timezone })
      return slots.map((s, i) => ({ ...s, id: `n${i}`, mentor_id: "me", created_at: "", updated_at: "" }))
    },
  }
  return { repo, calls, fail: () => (failNext = true) }
}

const stored = (mentor_id: string): AvailabilitySlot => ({
  id: "s1",
  mentor_id,
  day_of_week: 1,
  start_time: "09:00:00",
  end_time: "10:00:00",
  timezone: "America/Sao_Paulo",
  created_at: "",
  updated_at: "",
})

describe("mentor availability service", () => {
  it("lists only the requested mentor's slots", async () => {
    const { repo } = createInMemoryRepo([stored("a"), stored("b")])
    const result = await createMentorAvailabilityService({ repo }).list("a")
    expect(result).toEqual({ kind: "ok", slots: [stored("a")] })
  })

  it("reports failed instead of throwing when the repository breaks", async () => {
    const fake = createInMemoryRepo()
    fake.fail()
    expect(await createMentorAvailabilityService({ repo: fake.repo }).list("a")).toEqual({ kind: "failed" })
  })

  it("normalizes times and fills the timezone before saving", async () => {
    const fake = createInMemoryRepo()
    const result = await createMentorAvailabilityService({ repo: fake.repo }).saveOwn({
      timezone: "America/Recife",
      slots: [
        { day_of_week: 2, start_time: "14:00", end_time: "15:00", timezone: null, is_active: true },
        { day_of_week: 3, start_time: "08:30:00", end_time: "09:00", timezone: "Europe/Lisbon", is_active: true },
      ],
    })
    expect(result.kind).toBe("saved")
    expect(fake.calls).toEqual([
      {
        timezone: "America/Recife",
        slots: [
          { day_of_week: 2, start_time: "14:00:00", end_time: "15:00:00", timezone: "America/Recife" },
          { day_of_week: 3, start_time: "08:30:00", end_time: "09:00:00", timezone: "Europe/Lisbon" },
        ],
      },
    ])
  })

  it("falls back to the default timezone when none is given", async () => {
    const fake = createInMemoryRepo()
    await createMentorAvailabilityService({ repo: fake.repo }).saveOwn({
      slots: [{ day_of_week: 1, start_time: "09:00", end_time: "10:00", timezone: null, is_active: true }],
    })
    expect(fake.calls[0]).toEqual({
      timezone: null,
      slots: [{ day_of_week: 1, start_time: "09:00:00", end_time: "10:00:00", timezone: "America/Sao_Paulo" }],
    })
  })

  it("rejects an inverted slot without calling the database", async () => {
    const fake = createInMemoryRepo()
    const result = await createMentorAvailabilityService({ repo: fake.repo }).saveOwn({
      slots: [{ day_of_week: 4, start_time: "10:00", end_time: "09:00", timezone: null, is_active: true }],
    })
    expect(result).toEqual({ kind: "invalid_range", dayOfWeek: 4 })
    expect(fake.calls).toEqual([])
  })

  it("an empty list clears the schedule", async () => {
    const fake = createInMemoryRepo()
    const result = await createMentorAvailabilityService({ repo: fake.repo }).saveOwn({ slots: [] })
    expect(result).toEqual({ kind: "saved", slots: [] })
    expect(fake.calls).toEqual([{ slots: [], timezone: null }])
  })

  it("reports failed when the save breaks", async () => {
    const fake = createInMemoryRepo()
    fake.fail()
    const result = await createMentorAvailabilityService({ repo: fake.repo }).saveOwn({ slots: [] })
    expect(result).toEqual({ kind: "failed" })
  })
})
