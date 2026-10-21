/**
 * @jest-environment node
 */
import { POST } from "./route"
import { NextRequest } from "next/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { resolveAudience } from "@/lib/services/invites/audience.service"

jest.mock("@/lib/auth/require-admin", () => ({ requireAdmin: jest.fn() }))
jest.mock("@/lib/services/invites/audience.service", () => ({ resolveAudience: jest.fn() }))
// The service confirms the actor again with `is_admin()` through this session.
const mockRpc = jest.fn()
jest.mock("@/lib/utils/supabase/server", () => ({
  createClient: jest.fn(async () => ({ rpc: mockRpc }))
}))
jest.mock("@/lib/utils/supabase/service-role", () => ({
  createServiceRoleClient: jest.fn().mockReturnValue({})
}))

const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>

function makeRequest(body: any) {
  return new NextRequest("http://localhost:3000/api/admin/invites/audience", {
    method: "POST",
    body: JSON.stringify(body)
  })
}

describe("POST /api/admin/invites/audience", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRpc.mockResolvedValue({ data: true, error: null })
    mockRequireAdmin.mockResolvedValue({ ok: true, admin: { userId: "admin-1", role: "admin" } })
  })

  it("rejects non-admins", async () => {
    const { NextResponse } = await import("next/server")
    mockRequireAdmin.mockResolvedValue({ ok: false, response: NextResponse.json({ error: "x" }, { status: 403 }) })
    const res = await POST(makeRequest({ audience: "all", campaign: "c1" }))
    expect(res.status).toBe(403)
  })

  it("rejects when is_admin() does not confirm, before reading any audience", async () => {
    mockRpc.mockResolvedValue({ data: false, error: null })
    const res = await POST(makeRequest({ audience: "all", campaign: "c1" }))
    expect(res.status).toBe(403)
    expect(resolveAudience).not.toHaveBeenCalled()
  })

  it("rejects an invalid audience value", async () => {
    const res = await POST(makeRequest({ audience: "everyone", campaign: "c1" }))
    expect(res.status).toBe(400)
  })

  it("returns the eligible count and skip breakdown", async () => {
    ;(resolveAudience as jest.Mock).mockResolvedValue({
      eligible: [{ id: "u1" }, { id: "u2" }],
      skipped: { suppressed: 1, optedOut: 0, alreadyInvited: 2, noEmail: 0 }
    })
    const res = await POST(makeRequest({ audience: "jotform_not_invited", campaign: "estagiorecife-2026" }))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json).toEqual({ eligibleUserIds: ["u1", "u2"], skipped: { suppressed: 1, optedOut: 0, alreadyInvited: 2, noEmail: 0 } })
  })

  it("does not leak the database message on failure", async () => {
    ;(resolveAudience as jest.Mock).mockRejectedValue(new Error('relation "profiles" does not exist'))
    jest.spyOn(console, "error").mockImplementation(() => undefined)
    const res = await POST(makeRequest({ audience: "all", campaign: "c1" }))
    expect(res.status).toBe(500)
    expect(JSON.stringify(await res.json())).not.toContain("relation")
  })
})
