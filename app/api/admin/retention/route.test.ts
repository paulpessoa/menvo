/**
 * @jest-environment node
 */
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { AdminForbiddenError } from "@/lib/services/admin/assert-admin"
import { GET } from "./route"
import { POST } from "./exempt/route"

jest.mock("@/lib/auth/require-admin", () => ({ requireAdmin: jest.fn() }))
jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn().mockResolvedValue({}) }))

const getRetentionOverview = jest.fn()
const exemptFromRetention = jest.fn()
jest.mock("@/lib/services/admin/ops.composition", () => ({
  buildAdminRetentionService: () => ({ getRetentionOverview, exemptFromRetention })
}))

const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>
const allow = () => mockRequireAdmin.mockResolvedValue({ ok: true, admin: { userId: "admin-1", role: "admin" } })
const USER = "3f1c1c1e-6c1a-4a53-9a39-0b7d7b0f6a11"

const post = (body: unknown) =>
  new Request("http://localhost/api/admin/retention/exempt", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body)
  })

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
})

describe("GET /api/admin/retention", () => {
  it("returns the guard response for a non-admin", async () => {
    mockRequireAdmin.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    })
    expect((await GET()).status).toBe(403)
    expect(getRetentionOverview).not.toHaveBeenCalled()
  })

  it("keeps the response shape", async () => {
    allow()
    getRetentionOverview.mockResolvedValue({ stats: { a: 1 }, queue: [], inactiveStats: { b: 2 }, inactiveQueue: [] })
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      success: true,
      stats: { a: 1 },
      queue: [],
      inactiveStats: { b: 2 },
      inactiveQueue: []
    })
  })

  it("maps the service refusal to 403", async () => {
    allow()
    getRetentionOverview.mockRejectedValue(new AdminForbiddenError())
    expect((await GET()).status).toBe(403)
  })

  it("hides the database message on failure", async () => {
    allow()
    getRetentionOverview.mockRejectedValue(new Error('column "secret" does not exist'))
    const res = await GET()
    expect(res.status).toBe(500)
    expect(JSON.stringify(await res.json())).not.toContain("secret")
  })
})

describe("POST /api/admin/retention/exempt", () => {
  it("rejects a userId that is not a UUID", async () => {
    allow()
    expect((await POST(post({ userId: "abc" }))).status).toBe(400)
    expect((await POST(post("not json"))).status).toBe(400)
    expect(exemptFromRetention).not.toHaveBeenCalled()
  })

  it("exempts the user passing the acting admin", async () => {
    allow()
    exemptFromRetention.mockResolvedValue(undefined)
    const res = await POST(post({ userId: USER }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(exemptFromRetention).toHaveBeenCalledWith("admin-1", USER)
  })

  it("maps the service refusal to 403 and hides other errors", async () => {
    allow()
    exemptFromRetention.mockRejectedValueOnce(new AdminForbiddenError())
    expect((await POST(post({ userId: USER }))).status).toBe(403)
    exemptFromRetention.mockRejectedValueOnce(new Error("constraint x"))
    const res = await POST(post({ userId: USER }))
    expect(res.status).toBe(500)
    expect(JSON.stringify(await res.json())).not.toContain("constraint")
  })
})
