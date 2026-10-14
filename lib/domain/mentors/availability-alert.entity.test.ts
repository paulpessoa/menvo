import { isValidAlertEmail } from "./availability-alert.entity"

describe("availability alert entity", () => {
  it("validates correct email formats", () => {
    expect(isValidAlertEmail("user@example.com")).toBe(true)
    expect(isValidAlertEmail("mentorado.dev@menvo.com.br")).toBe(true)
    expect(isValidAlertEmail("user+tag@gmail.com")).toBe(true)
  })

  it("rejects invalid email formats", () => {
    expect(isValidAlertEmail("")).toBe(false)
    expect(isValidAlertEmail("user@")).toBe(false)
    expect(isValidAlertEmail("user@domain")).toBe(false)
    expect(isValidAlertEmail("not-an-email")).toBe(false)
    expect(isValidAlertEmail("spaces in@email.com")).toBe(false)
  })
})
