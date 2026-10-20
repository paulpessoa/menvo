/**
 * @jest-environment node
 */
import { NextResponse } from "next/server"
import { GET } from "./route"
import { requireOrgAdmin } from "@/lib/auth/require-org-admin"
import { getOrgDashboard } from "@/lib/services/organizations/org-dashboard.service"

jest.mock("@/lib/utils/supabase/server", () => ({
  createClient: jest.fn().mockResolvedValue({}),
}))
jest.mock("@/lib/auth/require-org-admin", () => ({ requireOrgAdmin: jest.fn() }))
jest.mock("@/lib/services/organizations/org-dashboard.service", () => ({ getOrgDashboard: jest.fn() }))

const ID = "33333333-3333-4333-8333-333333333333"
const call = (id: string, query = "") =>
  GET(new Request(`http://localhost/api/org/${id}${query}`), { params: Promise.resolve({ id }) })

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
})
afterEach(() => jest.restoreAllMocks())

describe("GET /api/org/[id]", () => {
  it("answers 400 for an id that is not a UUID, without touching auth or the database", async () => {
    const res = await call("not-a-uuid")
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: "VALIDATION_ERROR" })
    expect(requireOrgAdmin).not.toHaveBeenCalled()
    expect(getOrgDashboard).not.toHaveBeenCalled()
  })

  it("passes through the guard's 401/403", async () => {
    ;(requireOrgAdmin as jest.Mock).mockResolvedValueOnce({
      ok: false,
      response: NextResponse.json({ error: "Acesso negado", code: "FORBIDDEN" }, { status: 403 }),
    })
    const res = await call(ID)
    expect(res.status).toBe(403)
    expect(getOrgDashboard).not.toHaveBeenCalled()
  })

  it("answers 404 when the org does not exist", async () => {
    ;(requireOrgAdmin as jest.Mock).mockResolvedValueOnce({ ok: true })
    ;(getOrgDashboard as jest.Mock).mockResolvedValueOnce(null)
    const res = await call(ID)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Organização não encontrada", code: "NOT_FOUND" })
  })

  it("wraps the dashboard in { data } and forwards a known period", async () => {
    const dashboard = { organization: { id: ID }, members: [], summary: {} }
    ;(requireOrgAdmin as jest.Mock).mockResolvedValueOnce({ ok: true })
    ;(getOrgDashboard as jest.Mock).mockResolvedValueOnce(dashboard)
    const res = await call(ID, "?period=90d")
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ data: dashboard })
    expect(getOrgDashboard).toHaveBeenCalledWith(expect.anything(), ID, "90d")
  })

  it("falls back to the whole period for an unknown ?period=", async () => {
    ;(requireOrgAdmin as jest.Mock).mockResolvedValueOnce({ ok: true })
    ;(getOrgDashboard as jest.Mock).mockResolvedValueOnce({ organization: {}, members: [], summary: {} })
    await call(ID, "?period=forever")
    expect(getOrgDashboard).toHaveBeenCalledWith(expect.anything(), ID, "all")
  })
})
