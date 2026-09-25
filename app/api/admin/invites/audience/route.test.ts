/**
 * @jest-environment node
 */
import { POST } from "./route"
import { NextRequest } from "next/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { resolveAudience } from "@/lib/services/invites/audience.service"

jest.mock("@/lib/auth/require-admin", () => ({ requireAdmin: jest.fn() }))
jest.mock("@/lib/services/invites/audience.service", () => ({ resolveAudience: jest.fn() }))

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
    mockRequireAdmin.mockResolvedValue({ ok: true, admin: { userId: "admin-1", role: "admin" } })
  })

  it("rejects non-admins", async () => {
    const { NextResponse } = await import("next/server")
    mockRequireAdmin.mockResolvedValue({ ok: false, response: NextResponse.json({ error: "x" }, { status: 403 }) })
    const res = await POST(makeRequest({ audience: "all", campaign: "c1" }))
    expect(res.status).toBe(403)
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
})
