import { participantRole } from "./appointment.entity"

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
