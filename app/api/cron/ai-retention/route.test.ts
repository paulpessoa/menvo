/**
 * @jest-environment node
 */
import { GET } from "./route"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"

jest.mock("@/lib/utils/supabase/service-role", () => ({
  createServiceRoleClient: jest.fn()
}))

describe("GET /api/cron/ai-retention", () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = {
      ...originalEnv,
      CRON_SECRET: "test-cron-secret-key"
    }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it("returns 401 when CRON_SECRET is set and Authorization header does not match", async () => {
    const req = new Request("http://localhost:3000/api/cron/ai-retention", {
      headers: {
        authorization: "Bearer wrong-secret"
      }
    })

    const res = await GET(req)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toContain("Unauthorized")
  })

  it("successfully purges expired AI data and returns metrics", async () => {
    const mockSessionsUpdate = jest.fn().mockReturnValue({
      in: jest.fn().mockReturnValue({
        lt: jest.fn().mockReturnValue({
          neq: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: [{ id: "session-1" }, { id: "session-2" }],
              error: null
            })
          })
        })
      })
    })

    const mockThreadsDelete = jest.fn().mockReturnValue({
      lt: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [{ id: "thread-1" }],
          error: null
        })
      })
    })

    const mockSharesDelete = jest.fn().mockReturnValue({
      not: jest.fn().mockReturnValue({
        lt: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [{ id: "share-old-1" }],
            error: null
          })
        })
      })
    })

    const mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === "diagnostic_sessions") {
          return { update: mockSessionsUpdate }
        }
        if (table === "ai_threads") {
          return { delete: mockThreadsDelete }
        }
        if (table === "diagnostic_shares") {
          return { delete: mockSharesDelete }
        }
        return {}
      })
    }

    ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockSupabase)

    const req = new Request("http://localhost:3000/api/cron/ai-retention", {
      headers: {
        authorization: "Bearer test-cron-secret-key"
      }
    })

    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.clearedDiagnosticStates).toBe(2)
    expect(json.purgedAiThreads).toBe(1)
    expect(json.purgedDiagnosticShares).toBe(1)
    expect(json.errors).toHaveLength(0)
  })
})
