import {
  MENTORSHIP_REASON_MAX_LENGTH,
  MENTORSHIP_REASON_MIN_LENGTH,
  createAppointmentSchema,
  mentorshipReasonSchema
} from "./appointment"

const base = {
  mentor_id: "9b2f7f2e-3c4d-4e5f-8a6b-1c2d3e4f5a6b",
  scheduled_at: "2026-10-07T16:00:00.000Z"
}
const VALID = "Quero orientação sobre transição de carreira para dados"

describe("mentorshipReasonSchema", () => {
  it("accepts a reason with the minimum length and trims it", () => {
    const exact = "a".repeat(MENTORSHIP_REASON_MIN_LENGTH)
    expect(mentorshipReasonSchema.parse(`  ${exact}  `)).toBe(exact)
  })

  it("rejects a reason one character below the minimum", () => {
    const result = mentorshipReasonSchema.safeParse("a".repeat(MENTORSHIP_REASON_MIN_LENGTH - 1))
    expect(result.success).toBe(false)
  })

  it("does not count surrounding whitespace toward the minimum", () => {
    const result = mentorshipReasonSchema.safeParse(" ".repeat(40))
    expect(result.success).toBe(false)
  })

  it("rejects a reason above the maximum length", () => {
    const result = mentorshipReasonSchema.safeParse("a".repeat(MENTORSHIP_REASON_MAX_LENGTH + 1))
    expect(result.success).toBe(false)
  })
})

describe("createAppointmentSchema", () => {
  it("requires notes_mentee", () => {
    const result = createAppointmentSchema.safeParse(base)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("motivo")
    }
  })

  it("rejects an empty notes_mentee", () => {
    expect(createAppointmentSchema.safeParse({ ...base, notes_mentee: "" }).success).toBe(false)
  })

  it("accepts a valid request and applies defaults", () => {
    const result = createAppointmentSchema.safeParse({ ...base, notes_mentee: VALID })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.duration_minutes).toBe(60)
      expect(result.data.mentorship_topics).toEqual([])
      expect(result.data.notes_mentee).toBe(VALID)
    }
  })
})
