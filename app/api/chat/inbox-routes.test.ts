/**
 * @jest-environment node
 */
import { GET as getConversations } from "./conversations/route"
import { GET as getUnread } from "./unread-count/route"
import { createClient } from "@/lib/utils/supabase/server"

jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn() }))

/** Client falso: sessão + tabelas conversations/messages vazias de erro. */
function mockSession(user: { id: string } | null, fail = false) {
  const result = fail ? { data: null, error: { message: "boom" }, count: null } : { data: [], error: null, count: 0 }
  const builder: Record<string, unknown> = {}
  for (const m of ["select", "or", "order", "in", "neq", "is"]) builder[m] = () => builder
  builder.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
  ;(createClient as jest.Mock).mockResolvedValue({
    auth: { getUser: async () => ({ data: { user } }) },
    from: () => builder,
  })
}

beforeEach(() => jest.spyOn(console, "error").mockImplementation(() => undefined))
afterEach(() => jest.restoreAllMocks())

describe("GET /api/chat/conversations", () => {
  it("returns 401 without a session", async () => {
    mockSession(null)
    expect((await getConversations()).status).toBe(401)
  })

  it("returns the envelope for a logged-in user", async () => {
    mockSession({ id: "u1" })
    const res = await getConversations()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ conversations: [] })
  })

  it("returns a generic 500 on repository failure", async () => {
    mockSession({ id: "u1" }, true)
    const res = await getConversations()
    expect(res.status).toBe(500)
    expect(JSON.stringify(await res.json())).not.toContain("boom")
  })
})

describe("GET /api/chat/unread-count", () => {
  it("returns 401 without a session", async () => {
    mockSession(null)
    expect((await getUnread()).status).toBe(401)
  })

  it("returns the count", async () => {
    mockSession({ id: "u1" })
    const res = await getUnread()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ count: 0 })
  })

  it("returns a generic 500 on repository failure", async () => {
    mockSession({ id: "u1" }, true)
    expect((await getUnread()).status).toBe(500)
  })
})
