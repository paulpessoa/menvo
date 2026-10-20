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

describe("noShowAppointmentSchema", () => {
  it("accepts appointmentId and optional notes", async () => {
    const { noShowAppointmentSchema } = await import("./appointment")
    const result = noShowAppointmentSchema.safeParse({
      appointmentId: "123",
      notes: "Mentorado não apareceu"
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.appointmentId).toBe("123")
      expect(result.data.notes).toBe("Mentorado não apareceu")
    }
  })

  it("converts numeric appointmentId to string", async () => {
    const { noShowAppointmentSchema } = await import("./appointment")
    const result = noShowAppointmentSchema.safeParse({
      appointmentId: 456
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.appointmentId).toBe("456")
      expect(result.data.notes).toBeUndefined()
    }
  })

  it("rejects notes longer than 1000 characters", async () => {
    const { noShowAppointmentSchema } = await import("./appointment")
    const result = noShowAppointmentSchema.safeParse({
      appointmentId: "123",
      notes: "a".repeat(1001)
    })
    expect(result.success).toBe(false)
  })
})

describe("appointment status and query schemas", () => {
  it("appointmentStatusSchema accepts the four database statuses only", async () => {
    const { appointmentStatusSchema } = await import("./appointment")
    for (const s of ["pending", "confirmed", "completed", "cancelled"]) {
      expect(appointmentStatusSchema.safeParse(s).success).toBe(true)
    }
    for (const s of ["rejected", "expired", "Pending", ""]) {
      expect(appointmentStatusSchema.safeParse(s).success).toBe(false)
    }
  })

  it("appointmentIdSchema requires a UUID", async () => {
    const { appointmentIdSchema } = await import("./appointment")
    expect(appointmentIdSchema.safeParse("9b2f7f2e-3c4d-4e5f-8a6b-1c2d3e4f5a6b").success).toBe(true)
    expect(appointmentIdSchema.safeParse("123").success).toBe(false)
  })

  it("listAppointmentsQuerySchema defaults the limit and caps it", async () => {
    const { listAppointmentsQuerySchema } = await import("./appointment")
    expect(listAppointmentsQuerySchema.parse({}).limit).toBe(10)
    expect(listAppointmentsQuerySchema.parse({ limit: "25", role: "mentor", status: "pending" })).toEqual({
      limit: 25,
      role: "mentor",
      status: "pending"
    })
    expect(listAppointmentsQuerySchema.safeParse({ limit: "abc" }).success).toBe(false)
    expect(listAppointmentsQuerySchema.safeParse({ limit: "100000" }).success).toBe(false)
    expect(listAppointmentsQuerySchema.safeParse({ role: "admin" }).success).toBe(false)
  })

  it("availabilityQuerySchema requires mentor_id and YYYY-MM-DD dates", async () => {
    const { availabilityQuerySchema } = await import("./appointment")
    expect(availabilityQuerySchema.safeParse({ mentor_id: "m1" }).success).toBe(true)
    expect(availabilityQuerySchema.safeParse({ mentor_id: "m1", start_date: "2026-10-20", end_date: "2026-11-03" }).success).toBe(true)
    expect(availabilityQuerySchema.safeParse({}).success).toBe(false)
    expect(availabilityQuerySchema.safeParse({ mentor_id: "m1", start_date: "20/10/2026" }).success).toBe(false)
  })

  it("actionAppointmentSchema accepts confirm and cancel, rejects the rest", async () => {
    const { actionAppointmentSchema } = await import("./appointment")
    expect(actionAppointmentSchema.safeParse({ token: "t", action: "confirm" }).success).toBe(true)
    expect(actionAppointmentSchema.safeParse({ token: "t", action: "cancel", reason: "x" }).success).toBe(true)
    expect(actionAppointmentSchema.safeParse({ token: "t", action: "delete" }).success).toBe(false)
    expect(actionAppointmentSchema.safeParse({ action: "confirm" }).success).toBe(false)
  })

  it("markCompletedAppointmentSchema converts a numeric id to string", async () => {
    const { markCompletedAppointmentSchema } = await import("./appointment")
    expect(markCompletedAppointmentSchema.parse({ appointmentId: 7 }).appointmentId).toBe("7")
    expect(markCompletedAppointmentSchema.safeParse({}).success).toBe(false)
  })
})
