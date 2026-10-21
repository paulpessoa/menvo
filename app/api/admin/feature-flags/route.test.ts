/**
 * @jest-environment node
 */
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { AdminForbiddenError } from "@/lib/services/admin/assert-admin"
import { FeatureFlagNotFoundError } from "@/lib/services/admin/feature-flags.service"
import { GET, POST, PUT, DELETE } from "./route"

jest.mock("@/lib/auth/require-admin", () => ({ requireAdmin: jest.fn() }))
jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn().mockResolvedValue({}) }))

const service = {
  listFlagsWithLogs: jest.fn(),
  createFlag: jest.fn(),
  setFlagEnabled: jest.fn(),
  deleteFlag: jest.fn()
}
jest.mock("@/lib/services/admin/ops.composition", () => ({
  buildAdminFeatureFlagsService: () => service
}))

const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>
const allow = () => mockRequireAdmin.mockResolvedValue({ ok: true, admin: { userId: "admin-1", role: "admin" } })
const req = (method: string, body?: unknown, qs = "") =>
  new Request(`http://localhost/api/admin/feature-flags${qs}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body)
  })

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
  allow()
})

describe("/api/admin/feature-flags", () => {
  it("returns the guard response for a non-admin on every method", async () => {
    mockRequireAdmin.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    })
    expect((await GET()).status).toBe(403)
    expect((await POST(req("POST", { name: "x" }))).status).toBe(403)
    expect((await PUT(req("PUT", { id: 1, enabled: true }))).status).toBe(403)
    expect((await DELETE(req("DELETE", undefined, "?id=1"))).status).toBe(403)
    expect(service.listFlagsWithLogs).not.toHaveBeenCalled()
  })

  it("GET keeps the { flags, logs } shape", async () => {
    service.listFlagsWithLogs.mockResolvedValue({ flags: [{ id: 1 }], logs: [] })
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ flags: [{ id: 1 }], logs: [] })
  })

  it("GET maps the service 403 and hides database errors", async () => {
    service.listFlagsWithLogs.mockRejectedValueOnce(new AdminForbiddenError())
    expect((await GET()).status).toBe(403)
    service.listFlagsWithLogs.mockRejectedValueOnce(new Error("relation secret_table"))
    const res = await GET()
    expect(res.status).toBe(500)
    expect(JSON.stringify(await res.json())).not.toContain("secret_table")
  })

  it("POST validates the body and keeps the { data } shape", async () => {
    expect((await POST(req("POST", { name: "  " }))).status).toBe(400)
    expect(service.createFlag).not.toHaveBeenCalled()
    service.createFlag.mockResolvedValue({ id: 2, name: "chat" })
    const res = await POST(req("POST", { name: "chat", description: "d", tags: ["a"] }))
    expect(await res.json()).toEqual({ data: { id: 2, name: "chat" } })
    expect(service.createFlag).toHaveBeenCalledWith("admin-1", { name: "chat", description: "d", tags: ["a"] })
  })

  it("PUT validates and toggles; extra body fields are ignored", async () => {
    expect((await PUT(req("PUT", { id: "x", enabled: true }))).status).toBe(400)
    service.setFlagEnabled.mockResolvedValue(undefined)
    const res = await PUT(req("PUT", { id: 3, enabled: true, name: "ignored", performed_by: "x" }))
    expect(await res.json()).toEqual({ success: true })
    expect(service.setFlagEnabled).toHaveBeenCalledWith("admin-1", 3, true)
  })

  it("PUT answers 404 for an unknown flag", async () => {
    service.setFlagEnabled.mockRejectedValue(new FeatureFlagNotFoundError())
    expect((await PUT(req("PUT", { id: 99, enabled: false }))).status).toBe(404)
  })

  it("DELETE requires a numeric id", async () => {
    expect((await DELETE(req("DELETE"))).status).toBe(400)
    expect((await DELETE(req("DELETE", undefined, "?id=abc"))).status).toBe(400)
    service.deleteFlag.mockResolvedValue(undefined)
    const res = await DELETE(req("DELETE", undefined, "?id=5"))
    expect(await res.json()).toEqual({ success: true })
    expect(service.deleteFlag).toHaveBeenCalledWith("admin-1", 5)
  })
})
