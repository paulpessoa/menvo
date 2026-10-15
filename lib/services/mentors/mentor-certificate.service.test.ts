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
    /** mentors_view (perfil) + mentor_public_stats (números públicos, o que um visitante enxerga). */
    function mockDb(mentor: Record<string, unknown> | null, stats: Record<string, unknown> | null) {
      const maybeSingle = jest.fn().mockResolvedValue({ data: mentor, error: null })
      const eqSecond = jest.fn().mockReturnValue({ maybeSingle })
      const eqFirst = jest.fn().mockReturnValue({ eq: eqSecond })
      return {
        from: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ eq: eqFirst }) }),
        rpc: jest.fn().mockResolvedValue({ data: stats ? [stats] : [], error: null })
      } as any
    }

    const mentor = {
      id: "98765432-1111-2222-3333-444455556666",
      slug: "paulo-silva",
      full_name: "Paulo Silva",
      job_title: "Senior Staff Engineer",
      created_at: "2025-01-15T10:00:00Z",
      verified: true
    }

    it("returns null if mentor has 0 completed sessions", async () => {
      const db = mockDb(mentor, { total_sessions: 0, average_rating: null, total_reviews: 0 })
      expect(await mentorCertificateService.getCertificate("paulo-silva", db)).toBeNull()
    })

    it("returns null if mentor does not exist or is not publicly listed", async () => {
      expect(await mentorCertificateService.getCertificate("non-existent", mockDb(null, null))).toBeNull()
      expect(await mentorCertificateService.getCertificate("paulo-silva", mockDb(mentor, null))).toBeNull()
    })

    it("uses the public stats function, not the RLS-scoped view, for the numbers", async () => {
      const db = mockDb(mentor, { total_sessions: 20, average_rating: 4.9, total_reviews: 18 })
      const result = await mentorCertificateService.getCertificate(mentor.id, db, "pt-BR")

      expect(db.rpc).toHaveBeenCalledWith("mentor_public_stats", { p_mentor_id: mentor.id })
      expect(result?.mentorName).toBe("Paulo Silva")
      expect(result?.mentorTitle).toBe("Senior Staff Engineer")
      expect(result?.totalSessions).toBe(20)
      expect(result?.totalHours).toBe(15)
      expect(result?.totalMinutes).toBe(900)
      expect(result?.averageRating).toBe(4.9)
      expect(result?.totalReviews).toBe(18)
      expect(result?.verificationCode).toBe("MV-98765432-0014")
      expect(result?.verificationUrl).toContain("/certificate/paulo-silva")
    })

    it("keeps averageRating null when there are no approved reviews", async () => {
      const db = mockDb(mentor, { total_sessions: 1, average_rating: null, total_reviews: 0 })
      const result = await mentorCertificateService.getCertificate(mentor.id, db)
      expect(result?.averageRating).toBeNull()
      expect(result?.totalMinutes).toBe(45)
    })
  })
})
