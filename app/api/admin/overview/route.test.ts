/**
 * @jest-environment node
 */
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { AdminForbiddenError } from "@/lib/services/admin/assert-admin"
import { GET } from "./route"

jest.mock("@/lib/auth/require-admin", () => ({ requireAdmin: jest.fn() }))
jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn().mockResolvedValue({}) }))

const loadAdminOverview = jest.fn()
jest.mock("@/lib/services/admin/ops.composition", () => ({
  loadAdminOverview: (...args: unknown[]) => loadAdminOverview(...args)
}))

const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>
const allow = () => mockRequireAdmin.mockResolvedValue({ ok: true, admin: { userId: "admin-1", role: "admin" } })

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
})

describe("GET /api/admin/overview", () => {
  it("returns the guard response for a non-admin", async () => {
    mockRequireAdmin.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    })
    expect((await GET()).status).toBe(401)
    expect(loadAdminOverview).not.toHaveBeenCalled()
  })

  it("returns the overview uncached", async () => {
    allow()
    loadAdminOverview.mockResolvedValue({ users: { total: 3 } })
    const res = await GET()
    expect(res.status).toBe(200)
    expect(res.headers.get("Cache-Control")).toBe("private, no-store")
    expect(await res.json()).toEqual({ users: { total: 3 } })
  })

  it("maps the service refusal to 403 and keeps a fixed 500 message", async () => {
    allow()
    loadAdminOverview.mockRejectedValueOnce(new AdminForbiddenError())
    expect((await GET()).status).toBe(403)
    loadAdminOverview.mockRejectedValueOnce(new Error("relation x"))
    const res = await GET()
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: "Não foi possível carregar a visão geral" })
  })
})
