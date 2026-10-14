import { createAvailabilityAlertSchema, queryAvailabilityAlertSchema } from "./availability-alert"

describe("availability alert schemas", () => {
  describe("createAvailabilityAlertSchema", () => {
    it("accepts valid uuid and optional email", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000"
      expect(createAvailabilityAlertSchema.safeParse({ mentor_id: validUuid }).success).toBe(true)
      expect(
        createAvailabilityAlertSchema.safeParse({
          mentor_id: validUuid,
          email: "user@example.com",
        }).success
      ).toBe(true)
    })

    it("rejects invalid uuid", () => {
      expect(createAvailabilityAlertSchema.safeParse({ mentor_id: "invalid-uuid" }).success).toBe(false)
    })

    it("rejects invalid email", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000"
      expect(
        createAvailabilityAlertSchema.safeParse({
          mentor_id: validUuid,
          email: "not-an-email",
        }).success
      ).toBe(false)
    })
  })

  describe("queryAvailabilityAlertSchema", () => {
    it("accepts valid mentor_id", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000"
      expect(queryAvailabilityAlertSchema.safeParse({ mentor_id: validUuid }).success).toBe(true)
    })

    it("rejects invalid mentor_id", () => {
      expect(queryAvailabilityAlertSchema.safeParse({ mentor_id: "invalid" }).success).toBe(false)
    })
  })
})
