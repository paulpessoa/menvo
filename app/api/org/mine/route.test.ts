/**
 * @jest-environment node
 */
import { GET } from "./route"
import { createClient } from "@/lib/utils/supabase/server"

jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn() }))

/** Supabase fake: auth user plus the chain `organization_members` ends with. */
function fakeClient(opts: { user: { id: string } | null; rows?: unknown[]; error?: { message: string } }) {
  const chain: Record<string, unknown> = {}
  for (const m of ["select", "eq"]) chain[m] = jest.fn(() => chain)
  chain.then = (resolve: (v: unknown) => unknown) => resolve({ data: opts.rows ?? [], error: opts.error ?? null })
  return {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: opts.user }, error: null }) },
    from: jest.fn(() => chain),
    chain,
  }
}

beforeEach(() => jest.spyOn(console, "error").mockImplementation(() => {}))
afterEach(() => jest.restoreAllMocks())

describe("GET /api/org/mine", () => {
  it("answers 401 without a session", async () => {
    ;(createClient as jest.Mock).mockResolvedValueOnce(fakeClient({ user: null }))
    const res = await GET()
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: "Não autenticado", code: "UNAUTHORIZED" })
  })

  it("lists the orgs the user administers, as { data: [{ id, slug, name }] }", async () => {
    const client = fakeClient({
      user: { id: "u1" },
      rows: [
        { organization_id: "o1", organizations: { id: "o1", slug: "giral", name: "Giral" } },
        { organization_id: "o2", organizations: null },
      ],
    })
    ;(createClient as jest.Mock).mockResolvedValueOnce(client)
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ data: [{ id: "o1", slug: "giral", name: "Giral" }] })
    expect(client.from).toHaveBeenCalledWith("organization_members")
    expect(client.chain.eq).toHaveBeenCalledWith("role", "admin")
    expect(client.chain.eq).toHaveBeenCalledWith("status", "active")
  })

  it("answers 500 when the query fails", async () => {
    ;(createClient as jest.Mock).mockResolvedValueOnce(fakeClient({ user: { id: "u1" }, error: { message: "boom" } }))
    expect((await GET()).status).toBe(500)
  })
})
