import {
  mentorCertificateService,
  generateVerificationCode,
  calculateVolunteeredHours
} from "./mentor-certificate.service"

describe("mentorCertificateService", () => {
  describe("generateVerificationCode", () => {
    it("generates deterministic verification code from mentorId and sessions", () => {
      const code1 = generateVerificationCode("a1b2c3d4-e5f6-7890-abcd-ef1234567890", 15)
      const code2 = generateVerificationCode("a1b2c3d4-e5f6-7890-abcd-ef1234567890", 15)
      expect(code1).toBe(code2)
      expect(code1).toBe("MV-A1B2C3D4-000F")
    })

    it("handles zero sessions gracefully", () => {
      const code = generateVerificationCode("12345678-0000-0000-0000-000000000000", 0)
      expect(code).toBe("MV-12345678-0000")
    })
  })

  describe("calculateVolunteeredHours", () => {
    it("calculates 45-minute sessions to fractional hours correctly", () => {
      expect(calculateVolunteeredHours(0)).toBe(0)
      expect(calculateVolunteeredHours(1)).toBe(0.8) // 45 / 60 = 0.75 -> 0.8
      expect(calculateVolunteeredHours(2)).toBe(1.5) // 90 / 60 = 1.5
      expect(calculateVolunteeredHours(4)).toBe(3) // 180 / 60 = 3.0
      expect(calculateVolunteeredHours(10)).toBe(7.5) // 450 / 60 = 7.5
    })
  })

  describe("getCertificate", () => {
    it("returns null if mentor has 0 completed sessions", async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: {
                    id: "mentor-1",
                    full_name: "Mentor Zero",
                    total_sessions: 0,
                    verified: true
                  },
                  error: null
                })
              })
            })
          })
        })
      } as any

      const result = await mentorCertificateService.getCertificate("mentor-1", mockSupabase)
      expect(result).toBeNull()
    })

    it("returns null if mentor does not exist or query fails", async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: null,
                  error: null
                })
              })
            })
          })
        })
      } as any

      const result = await mentorCertificateService.getCertificate("non-existent", mockSupabase)
      expect(result).toBeNull()
    })

    it("returns complete certificate data for verified mentor with sessions", async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: {
                    id: "98765432-1111-2222-3333-444455556666",
                    slug: "paulo-silva",
                    full_name: "Paulo Silva",
                    job_title: "Senior Staff Engineer",
                    average_rating: 4.95,
                    total_sessions: 20,
                    total_reviews: 18,
                    created_at: "2025-01-15T10:00:00Z",
                    verified: true
                  },
                  error: null
                })
              })
            })
          })
        })
      } as any

      const result = await mentorCertificateService.getCertificate(
        "98765432-1111-2222-3333-444455556666",
        mockSupabase,
        "pt-BR"
      )

      expect(result).not.toBeNull()
      expect(result?.mentorName).toBe("Paulo Silva")
      expect(result?.mentorTitle).toBe("Senior Staff Engineer")
      expect(result?.totalSessions).toBe(20)
      expect(result?.totalHours).toBe(15) // 20 * 45 / 60 = 15
      expect(result?.averageRating).toBe(5) // 4.95 rounded to 1 decimal = 5.0
      expect(result?.verificationCode).toBe("MV-98765432-0014") // 20 in hex = 14
      expect(result?.isValid).toBe(true)
      expect(result?.verificationUrl).toContain("/certificate/paulo-silva")
    })
  })
})
