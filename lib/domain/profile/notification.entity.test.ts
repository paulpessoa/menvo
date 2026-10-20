import {
  buildNotifications,
  needsReviewedIds,
  type NotificationAppointment,
} from "./notification.entity"

const NOW = new Date("2026-10-19T12:00:00.000Z")
const minutesFromNow = (m: number) => new Date(NOW.getTime() + m * 60_000).toISOString()
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString()

const ME = "me"
const OTHER = "other"

function apt(extra: Partial<NotificationAppointment> = {}): NotificationAppointment {
  return {
    id: "a1",
    mentor_id: OTHER,
    mentee_id: ME,
    scheduled_at: minutesFromNow(120),
    status: "confirmed",
    notes_mentor: null,
    created_at: daysAgo(3),
    updated_at: daysAgo(2),
    mentor: { full_name: "Marta Mentora" },
    mentee: { full_name: "Caio Mentorado" },
    ...extra,
  }
}

const build = (appointments: NotificationAppointment[], role: string | null, reviewed: string[] = []) =>
  buildNotifications({
    appointments,
    reviewedAppointmentIds: new Set(reviewed),
    userId: ME,
    role,
    now: NOW,
  })

describe("buildNotifications as a mentee", () => {
  it("confirmed upcoming session becomes 'Mentoria confirmada' with the mentor's name", () => {
    const [n] = build([apt()], "mentee")
    expect(n).toMatchObject({
      id: "booking-confirmed-a1",
      type: "booking_confirmed",
      title: "Mentoria confirmada",
      actionUrl: "/mentorship/mentee#upcoming",
    })
    expect(n.message).toContain("Marta Mentora")
  })

  it("adds 'starting soon' only inside the 30 minute window, timestamped now", () => {
    const soon = build([apt({ scheduled_at: minutesFromNow(30) })], "mentee")
    expect(soon.map(n => n.type)).toContain("session_starting_soon")
    expect(soon.find(n => n.type === "session_starting_soon")).toMatchObject({
      timestamp: NOW.toISOString(),
      message: expect.stringContaining("30 minutos"),
    })

    const later = build([apt({ scheduled_at: minutesFromNow(31) })], "mentee")
    expect(later.map(n => n.type)).not.toContain("session_starting_soon")
  })

  it("a confirmed session in the past is 'Mentoria realizada' and links to the history", () => {
    const [n] = build([apt({ scheduled_at: minutesFromNow(-60) })], "mentee")
    expect(n).toMatchObject({ title: "Mentoria realizada", actionUrl: "/mentorship/mentee#history" })
  })

  it("asks for a review only on completed sessions not yet reviewed", () => {
    const completed = apt({ status: "completed" })
    expect(build([completed], "mentee").map(n => n.type)).toEqual(["pending_evaluation"])
    expect(build([completed], "mentee", ["a1"])).toEqual([])
  })

  it("cancelled sessions show for 14 days, with the mentor's reason", () => {
    const recent = build([apt({ status: "cancelled", updated_at: daysAgo(14), notes_mentor: "Imprevisto" })], "mentee")
    expect(recent).toHaveLength(1)
    expect(recent[0].message).toContain('Motivo: "Imprevisto"')
    expect(build([apt({ status: "cancelled", updated_at: daysAgo(15) })], "mentee")).toEqual([])
  })

  it("never shows the mentor-only 'new request' notification", () => {
    expect(build([apt({ status: "pending" })], "mentee")).toEqual([])
  })
})

describe("buildNotifications as a mentor", () => {
  const asMentor = (extra: Partial<NotificationAppointment> = {}) =>
    apt({ mentor_id: ME, mentee_id: OTHER, ...extra })

  it("a pending session is a booking request with the mentee's name", () => {
    const [n] = build([asMentor({ status: "pending" })], "mentor")
    expect(n).toMatchObject({
      id: "booking-request-a1",
      type: "booking_request",
      actionUrl: "/mentorship/mentor#action",
    })
    expect(n.message).toContain("Caio Mentorado")
  })

  it("never asks the mentor for a review", () => {
    expect(build([asMentor({ status: "completed" })], "mentor")).toEqual([])
  })

  it("falls back to a generic name when the other profile has no name", () => {
    const [n] = build([asMentor({ status: "pending", mentee: null })], "mentor")
    expect(n.message).toContain("Mentorado(a)")
  })
})

describe("role hint", () => {
  const both = [apt({ id: "m", status: "pending", mentor_id: ME, mentee_id: OTHER }), apt({ id: "e", status: "completed" })]

  it("without a role it computes both sides", () => {
    expect(build(both, null).map(n => n.type).sort()).toEqual(["booking_request", "pending_evaluation"])
  })

  it("only computes the side that was asked for", () => {
    expect(build(both, "mentor").map(n => n.type)).toEqual(["booking_request"])
    expect(build(both, "mentee").map(n => n.type)).toEqual(["pending_evaluation"])
  })

  it("an unknown role such as admin produces nothing, as the route always did", () => {
    expect(build(both, "admin")).toEqual([])
  })

  it("only the mentor role skips fetching reviewed ids", () => {
    expect(needsReviewedIds("mentor")).toBe(false)
    expect(needsReviewedIds("mentee")).toBe(true)
    expect(needsReviewedIds(null)).toBe(true)
  })
})

describe("ordering", () => {
  it("sorts the newest first", () => {
    const list = build(
      [
        apt({ id: "old", updated_at: daysAgo(5), scheduled_at: minutesFromNow(600) }),
        apt({ id: "new", updated_at: daysAgo(1), scheduled_at: minutesFromNow(600) }),
      ],
      "mentee"
    )
    expect(list.map(n => n.id)).toEqual(["booking-confirmed-new", "booking-confirmed-old"])
  })
})
