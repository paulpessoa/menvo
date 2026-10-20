import { buildNotifications } from "@/lib/domain/profile/notification.entity"
import { notificationsResponseSchema, toggleFavoriteSchema } from "./me"

describe("toggleFavoriteSchema", () => {
  const mentorId = "6f1c2a4e-1b2c-4d3e-9f00-0123456789ab"

  it("accepts add and remove with a UUID", () => {
    expect(toggleFavoriteSchema.safeParse({ mentorId, action: "add" }).success).toBe(true)
    expect(toggleFavoriteSchema.safeParse({ mentorId, action: "remove" }).success).toBe(true)
  })

  it.each([[{ mentorId: "x", action: "add" }], [{ mentorId, action: "toggle" }], [{}]])("rejects %j", body => {
    expect(toggleFavoriteSchema.safeParse(body).success).toBe(false)
  })
})

describe("notificationsResponseSchema", () => {
  it("describes what the entity actually produces, for every type", () => {
    const now = new Date("2026-10-19T12:00:00.000Z")
    const at = (m: number) => new Date(now.getTime() + m * 60_000).toISOString()
    const base = {
      notes_mentor: null,
      created_at: at(-60 * 24),
      updated_at: at(-60),
      mentor: { full_name: "M" },
      mentee: { full_name: "E" },
    }
    const notifications = buildNotifications({
      appointments: [
        { ...base, id: "p", mentor_id: "me", mentee_id: "x", scheduled_at: at(600), status: "pending" },
        { ...base, id: "s", mentor_id: "x", mentee_id: "me", scheduled_at: at(10), status: "confirmed" },
        { ...base, id: "c", mentor_id: "x", mentee_id: "me", scheduled_at: at(-600), status: "cancelled" },
        { ...base, id: "d", mentor_id: "x", mentee_id: "me", scheduled_at: at(-600), status: "completed" },
      ],
      reviewedAppointmentIds: new Set(),
      userId: "me",
      role: null,
      now,
    })

    expect(new Set(notifications.map(n => n.type))).toEqual(
      new Set(["booking_request", "booking_confirmed", "booking_cancelled", "pending_evaluation", "session_starting_soon"])
    )
    expect(notificationsResponseSchema.safeParse({ notifications }).success).toBe(true)
  })
})
