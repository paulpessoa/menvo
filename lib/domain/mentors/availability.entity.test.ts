import { isValidRange, toDbTime } from "./availability.entity"

describe("availability entity", () => {
  it("adds seconds only when the time comes without them", () => {
    expect(toDbTime("09:00")).toBe("09:00:00")
    expect(toDbTime("09:00:00")).toBe("09:00:00")
  })

  it("accepts a slot that ends after it starts", () => {
    expect(isValidRange({ start_time: "09:00", end_time: "09:45" })).toBe(true)
    expect(isValidRange({ start_time: "09:00:00", end_time: "09:30" })).toBe(true)
  })

  it("rejects empty or inverted slots", () => {
    expect(isValidRange({ start_time: "10:00", end_time: "10:00" })).toBe(false)
    expect(isValidRange({ start_time: "23:00", end_time: "01:00" })).toBe(false)
  })
})
