import { displayName, isMentorId } from "./mentor.entity"

describe("mentor entity", () => {
  it("tells a uuid apart from a slug", () => {
    expect(isMentorId("6f1c2a4e-1b2c-4d3e-9f00-0123456789ab")).toBe(true)
    expect(isMentorId("ana-souza")).toBe(false)
  })

  it("prefers full_name and falls back to first + last name", () => {
    expect(displayName({ full_name: "Ana Souza", first_name: "x", last_name: "y" })).toBe("Ana Souza")
    expect(displayName({ full_name: null, first_name: "Ana", last_name: "Souza" })).toBe("Ana Souza")
    expect(displayName({ full_name: null, first_name: "Ana", last_name: null })).toBe("Ana")
  })
})
