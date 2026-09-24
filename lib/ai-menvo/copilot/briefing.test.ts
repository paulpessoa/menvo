import { getUserBriefing } from "./briefing"
import type { SupabaseClient, User } from "@supabase/supabase-js"
import { diagnosticService } from "@/lib/services/diagnostic/diagnostic.service"

jest.mock("@/lib/services/diagnostic/diagnostic.service", () => ({
  diagnosticService: {
    getLatestCompletedSession: jest.fn()
  }
}))

describe("getUserBriefing", () => {
  const mockUser: User = {
    id: "user-123",
    app_metadata: {},
    user_metadata: { first_name: "Lucas" },
    aud: "authenticated",
    created_at: "2026-01-01T00:00:00Z"
  }

  const mockDiagnostic = diagnosticService.getLatestCompletedSession as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("builds a personalized briefing for a mentee with diagnostic available", async () => {
    mockDiagnostic.mockResolvedValue(null)

    const mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                first_name: "Lucas",
                last_name: "Silva",
                full_name: "Lucas Silva",
                job_title: "Junior Dev"
              }
            })
          }
        }
        if (table === "user_roles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            returns: jest.fn().mockResolvedValue({
              data: [{ roles: { name: "mentee" } }]
            })
          }
        }
        if (table === "appointments") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            neq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: []
            })
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis()
        }
      })
    } as unknown as SupabaseClient

    const briefing = await getUserBriefing(mockSupabase as any, mockUser)

    expect(briefing.user.firstName).toBe("Lucas")
    expect(briefing.user.role).toBe("mentee")
    expect(briefing.diagnostic.completedThisMonth).toBe(false)
    expect(briefing.greetingMessage).toContain("Lucas")
    expect(briefing.greetingMessage).toContain("**Diagnóstico de Carreira:** Seu diagnóstico gratuito deste mês está disponível!")
    expect(briefing.suggestedChips.some((c) => c.value === "mode:diagnostic")).toBe(true)
  })

  it("builds a mentor briefing with upcoming sessions and pending requests", async () => {
    mockDiagnostic.mockResolvedValue(null)

    const futureDate = new Date(Date.now() + 86400000).toISOString()

    const mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                first_name: "Carla",
                last_name: "Mentor",
                full_name: "Carla Mentor",
                job_title: "Tech Lead"
              }
            })
          }
        }
        if (table === "user_roles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            returns: jest.fn().mockResolvedValue({
              data: [{ roles: { name: "mentor" } }]
            })
          }
        }
        if (table === "appointments") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            neq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: [
                {
                  id: "apt-1",
                  status: "pending",
                  scheduled_at: futureDate,
                  google_meet_link: null,
                  meeting_link: null,
                  mentee: { full_name: "João Aluno", avatar_url: null, job_title: "Estudante" }
                }
              ]
            })
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis()
        }
      })
    } as unknown as SupabaseClient

    const briefing = await getUserBriefing(mockSupabase as any, { ...mockUser, id: "mentor-456" })

    expect(briefing.user.firstName).toBe("Carla")
    expect(briefing.user.role).toBe("mentor")
    expect(briefing.appointments.upcomingCount).toBe(1)
    expect(briefing.appointments.nextSession?.otherPartyName).toBe("João Aluno")
    expect(briefing.pendingActions.pendingRequestsCount).toBe(1)
    expect(briefing.greetingMessage).toContain("aguardando sua resposta")
  })
})
