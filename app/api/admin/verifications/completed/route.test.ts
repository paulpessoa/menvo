/**
 * @jest-environment node
 */
import { NextResponse } from "next/server"
import { GET } from "./route"
import { requireAdmin } from "@/lib/auth/require-admin"
import { createClient } from "@/lib/utils/supabase/server"
import { buildMentorVerificationListService } from "@/lib/services/verifications/verification.composition"
import { AdminForbiddenError } from "@/lib/services/admin/assert-admin"

jest.mock("@/lib/auth/require-admin", () => ({ requireAdmin: jest.fn() }))
jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn() }))
jest.mock("@/lib/services/verifications/verification.composition", () => ({
  buildMentorVerificationListService: jest.fn(),
}))

const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>
const mockBuild = buildMentorVerificationListService as jest.MockedFunction<typeof buildMentorVerificationListService>
const listVerifications = jest.fn()

describe("GET /api/admin/verifications/completed", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue({})
    mockBuild.mockReturnValue({ listVerifications } as never)
    mockRequireAdmin.mockResolvedValue({ ok: true, admin: { userId: "admin-1", role: "admin" } })
  })

  it("returns the guard's response without building the service", async () => {
    mockRequireAdmin.mockResolvedValue({ ok: false, response: NextResponse.json({ error: "x" }, { status: 401 }) })
    const res = await GET()
    expect(res.status).toBe(401)
    expect(mockBuild).not.toHaveBeenCalled()
  })

  it("answers 403 when the service refuses the actor", async () => {
    listVerifications.mockRejectedValue(new AdminForbiddenError())
    const res = await GET()
    expect(res.status).toBe(403)
  })

  it("lists approved and rejected applications", async () => {
    listVerifications.mockResolvedValue([{ id: "u1" }])
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ verifications: [{ id: "u1" }] })
    expect(listVerifications).toHaveBeenCalledWith(["approved", "rejected"])
  })

  it("answers 500 with a fixed message on unexpected errors", async () => {
    listVerifications.mockRejectedValue(new Error("boom"))
    jest.spyOn(console, "error").mockImplementation(() => undefined)
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
