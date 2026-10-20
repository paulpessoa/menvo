/**
 * @jest-environment node
 */
import { POST } from "./route"
import { createClient } from "@/lib/utils/supabase/server"

jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn() }))

const mockAdmin = { from: jest.fn() }
jest.mock("@supabase/supabase-js", () => ({ createClient: jest.fn(() => mockAdmin) }))

/** Sessão falsa; `order` registra a sequência de passos para provar a ordem. */
function mockSession(opts: { user?: { id: string } | null; withdrawError?: { message: string } | null; hideError?: { message: string } | null } = {}) {
  const order: string[] = []
  const adminCalls = { deleted: [] as unknown[][], inserted: [] as unknown[] }

  const session = {
    auth: { getUser: async () => ({ data: { user: opts.user === undefined ? { id: "u1" } : opts.user }, error: null }) },
    rpc: async (name: string) => {
      order.push(`rpc:${name}`)
      return { error: opts.withdrawError ?? null }
    },
    from: (table: string) => {
      if (table === "profiles") {
        return {
          update: () => ({
            eq: () => ({
              select: () => ({
                single: async () => {
                  order.push("hide")
                  return opts.hideError
                    ? { data: null, error: opts.hideError }
                    : { data: { id: "u1", is_public: false }, error: null }
                },
              }),
            }),
          }),
        }
      }
      // roles
      return {
        select: () => ({
          in: async () => ({
            data: [
              { id: 1, name: "mentee" },
              { id: 2, name: "mentor" },
            ],
            error: null,
          }),
        }),
      }
    },
  }

  mockAdmin.from.mockImplementation(() => ({
    delete: () => ({
      eq: (...a: unknown[]) => ({
        in: async (...b: unknown[]) => {
          order.push("role:remove")
          adminCalls.deleted.push([a, b])
          return { error: null }
        },
      }),
    }),
    select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
    insert: async (row: unknown) => {
      order.push("role:add")
      adminCalls.inserted.push(row)
      return { error: null }
    },
  }))
  ;(createClient as jest.Mock).mockResolvedValue(session)
  return { order, adminCalls }
}

describe("POST /api/profile/stop-mentor", () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321"
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test-key"
  })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, "error").mockImplementation(() => undefined)
  })

  it("returns 401 without a session", async () => {
    mockSession({ user: null })
    const res = await POST()
    expect(res.status).toBe(401)
  })

  it("withdraws, hides the profile, then swaps the role, and answers as before", async () => {
    const { order, adminCalls } = mockSession()
    const res = await POST()

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      data: { id: "u1", is_public: false, verified: false },
      message: "Você não é mais um mentor",
    })
    expect(order).toEqual(["rpc:withdraw_mentor_verification", "hide", "role:remove", "role:add"])
    expect(adminCalls.deleted[0][0]).toEqual(["user_id", "u1"])
    expect(adminCalls.deleted[0][1]).toEqual(["role_id", [2]])
    expect(adminCalls.inserted).toEqual([{ user_id: "u1", role_id: 1 }])
  })

  it("keeps the mentor role when the RPC fails", async () => {
    const { order } = mockSession({ withdrawError: { message: "rpc failed" } })
    const res = await POST()
    expect(res.status).toBe(500)
    expect(order).toEqual(["rpc:withdraw_mentor_verification"])
  })

  it("keeps the mentor role when hiding the profile fails", async () => {
    const { order } = mockSession({ hideError: { message: "denied" } })
    const res = await POST()
    expect(res.status).toBe(500)
    expect(order).not.toContain("role:remove")
  })
})
