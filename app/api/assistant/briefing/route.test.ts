/**
 * @jest-environment node
 */
import { GET } from "./route"
import { createClient } from "@/lib/utils/supabase/server"
import { getUserBriefing } from "@/lib/ai-menvo/copilot/briefing"

jest.mock("@/lib/utils/supabase/server", () => ({
  createClient: jest.fn()
}))

jest.mock("@/lib/ai-menvo/copilot/briefing", () => ({
  getUserBriefing: jest.fn()
}))

describe("GET /api/assistant/briefing", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("returns 401 when unauthenticated", async () => {
    ;(createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: { message: "No session" } })
      }
    })

    const response = await GET()
    expect(response.status).toBe(401)
    const json = await response.json()
    expect(json.error).toBe("Unauthorized")
  })

  it("returns briefing data for authenticated user", async () => {
    const mockUser = { id: "user-123" }
    const mockBriefing = {
      user: { id: "user-123", firstName: "Maria", fullName: "Maria Silva", role: "mentee" },
      greetingMessage: "Olá, Maria!",
      suggestedChips: []
    }

    ;(createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
      }
    })
    ;(getUserBriefing as jest.Mock).mockResolvedValue(mockBriefing)

    const response = await GET()
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.briefing).toEqual(mockBriefing)
  })
})
