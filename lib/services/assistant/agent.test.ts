/**
 * @jest-environment node
 */
import { getAssistantAgent } from "./agent"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getAgentModels } from "@/lib/ai/models"

jest.mock("@/lib/ai/models", () => ({
  getAgentModels: jest.fn()
}))

jest.mock("langchain", () => ({
  createAgent: jest.fn(({ tools, systemPrompt }) => ({
    tools,
    systemPrompt,
    streamEvents: jest.fn()
  })),
  modelFallbackMiddleware: jest.fn()
}))

describe("getAssistantAgent RBAC", () => {
  const mockPrimary = {} as any
  const mockGetAgentModels = getAgentModels as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAgentModels.mockResolvedValue({ primary: mockPrimary, fallbacks: [] })
  })

  it("configures mentee tools and prompt correctly", async () => {
    const mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === "user_roles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            returns: jest.fn().mockResolvedValue({ data: [{ roles: { name: "mentee" } }] })
          }
        }
        if (table === "profiles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { first_name: "Fernanda", full_name: "Fernanda Lima" } })
          }
        }
        return {}
      })
    } as unknown as SupabaseClient

    const agent: any = await getAssistantAgent(
      mockSupabase,
      { id: "mentee-1" } as any,
      { onCall: jest.fn() }
    )

    const toolNames = agent.tools.map((t: any) => t.name)
    expect(toolNames).toContain("searchMentors")
    expect(toolNames).toContain("getMyAppointments")
    expect(toolNames).toContain("getPendingEvaluations")
    expect(toolNames).not.toContain("getMentorRequests") // mentors only

    expect(agent.systemPrompt.content).toContain("Fernanda")
    expect(agent.systemPrompt.content).toContain("PAPEL DO USUÁRIO ATUAL: MENTORADO")
  })

  it("configures mentor tools and prompt enforcing Invariant #2 (no pending evaluations tool)", async () => {
    const mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === "user_roles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            returns: jest.fn().mockResolvedValue({ data: [{ roles: { name: "mentor" } }] })
          }
        }
        if (table === "profiles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { first_name: "Rodrigo", full_name: "Rodrigo Silva" } })
          }
        }
        return {}
      })
    } as unknown as SupabaseClient

    const agent: any = await getAssistantAgent(
      mockSupabase,
      { id: "mentor-1" } as any,
      { onCall: jest.fn() }
    )

    const toolNames = agent.tools.map((t: any) => t.name)
    expect(toolNames).toContain("searchMentors")
    expect(toolNames).toContain("getMyAppointments")
    expect(toolNames).toContain("getMentorRequests")
    expect(toolNames).not.toContain("getPendingEvaluations") // Invariant #2: Mentors NEVER evaluate

    expect(agent.systemPrompt.content).toContain("Rodrigo")
    expect(agent.systemPrompt.content).toContain("PAPEL DO USUÁRIO ATUAL: MENTOR")
  })

  it("supports backwards-compatible call without user object", async () => {
    const mockSupabase = {} as SupabaseClient

    const agent: any = await getAssistantAgent(mockSupabase, { onCall: jest.fn() })

    const toolNames = agent.tools.map((t: any) => t.name)
    expect(toolNames).toContain("searchMentors")
    expect(toolNames).toContain("getMentorAvailability")
    expect(toolNames).toContain("explainHowItWorks")
    expect(toolNames).toContain("saveFeedback")
    expect(toolNames).not.toContain("getMyAppointments")
  })
})
