import {
  addMinutesToTime,
  formatTimezoneLabel,
  getBrowserTimezone,
  generateTimeOptions
} from "./timezone"

describe("Timezone and Time Calculation Utilities", () => {
  describe("addMinutesToTime", () => {
    it("should add 45 minutes to 09:00:00 correctly", () => {
      expect(addMinutesToTime("09:00:00", 45)).toBe("09:45:00")
    })

    it("should add 45 minutes to 14:30:00 correctly rolling over hours", () => {
      expect(addMinutesToTime("14:30:00", 45)).toBe("15:15:00")
    })

    it("should add 45 minutes to 23:30:00 rolling over midnight", () => {
      expect(addMinutesToTime("23:30:00", 45)).toBe("00:15:00")
    })

    it("should handle short HH:MM format as input", () => {
      expect(addMinutesToTime("10:00", 45)).toBe("10:45:00")
    })
  })

  describe("formatTimezoneLabel", () => {
    it("should format America/Sao_Paulo nicely", () => {
      expect(formatTimezoneLabel("America/Sao_Paulo")).toContain("Horário de Brasília")
    })

    it("should fallback to browser timezone when given UTC or null", () => {
      const label = formatTimezoneLabel("UTC")
      expect(label).toBeTruthy()
      expect(label).not.toBe("UTC")
    })
  })

  describe("generateTimeOptions", () => {
    it("should generate 15-minute intervals", () => {
      const options = generateTimeOptions(9, 10)
      const values = options.map((o) => o.value)
      expect(values).toContain("09:00:00")
      expect(values).toContain("09:15:00")
      expect(values).toContain("09:30:00")
      expect(values).toContain("09:45:00")
      expect(values).toContain("10:00:00")
    })
  })
})
