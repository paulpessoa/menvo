import {
  ACTION_TOKEN_TTL_MS,
  actionTokenExpiry,
  isActionTokenExpired,
  participantRole,
} from "./appointment.entity"

describe("participantRole", () => {
  const appointment = { mentor_id: "mentor-1", mentee_id: "mentee-1" }

  it("identifies the mentor and the mentee", () => {
    expect(participantRole(appointment, "mentor-1")).toBe("mentor")
    expect(participantRole(appointment, "mentee-1")).toBe("mentee")
  })

  it("returns null for anyone who is not in the session", () => {
    expect(participantRole(appointment, "someone-else")).toBeNull()
  })
})

describe("action token expiry", () => {
  const NOW = new Date("2026-10-20T12:00:00.000Z")

  it("expires seven days after it is issued", () => {
    expect(actionTokenExpiry(NOW)).toBe("2026-10-27T12:00:00.000Z")
    expect(ACTION_TOKEN_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000)
  })

  it("is expired at and after the deadline, valid before it", () => {
    expect(isActionTokenExpired({ token_expires_at: "2026-10-20T12:00:01.000Z" }, NOW)).toBe(false)
    expect(isActionTokenExpired({ token_expires_at: "2026-10-20T12:00:00.000Z" }, NOW)).toBe(true)
    expect(isActionTokenExpired({ token_expires_at: "2026-10-01T00:00:00.000Z" }, NOW)).toBe(true)
  })

  it("treats a null deadline (old rows) as valid", () => {
    expect(isActionTokenExpired({ token_expires_at: null }, NOW)).toBe(false)
  })
})
