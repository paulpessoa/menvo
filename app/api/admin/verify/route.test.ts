/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from "next/server"
import { POST } from "./route"
import { requireAdmin } from "@/lib/auth/require-admin"
import { createClient } from "@/lib/utils/supabase/server"
import { buildMentorVerificationService } from "@/lib/services/verifications/verification.composition"
import { VerificationProfileNotFoundError } from "@/lib/services/verifications/notification.service"
import { AdminForbiddenError } from "@/lib/services/admin/assert-admin"

jest.mock("@/lib/auth/require-admin", () => ({ requireAdmin: jest.fn() }))
jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn() }))
jest.mock("@/lib/services/verifications/verification.composition", () => ({
  buildMentorVerificationService: jest.fn(),
}))

const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>
const mockBuild = buildMentorVerificationService as jest.MockedFunction<typeof buildMentorVerificationService>
const processVerification = jest.fn()

const UID = "123e4567-e89b-42d3-a456-426614174000"
const post = (body: unknown) =>
  POST(
    new NextRequest("http://localhost:3000/api/admin/verify", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    })
  )

describe("POST /api/admin/verify", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue({})
    mockBuild.mockReturnValue({ processVerification } as never)
    mockRequireAdmin.mockResolvedValue({ ok: true, admin: { userId: "admin-1", role: "admin" } })
    jest.spyOn(console, "error").mockImplementation(() => undefined)
  })

  it("returns the guard's response without building the service", async () => {
    mockRequireAdmin.mockResolvedValue({ ok: false, response: NextResponse.json({ error: "x" }, { status: 403 }) })
    const res = await post({ userId: UID, status: "approved" })
    expect(res.status).toBe(403)
    expect(mockBuild).not.toHaveBeenCalled()
  })

  it("answers 400 for a body that is not valid (userId must be a UUID)", async () => {
    const res = await post({ userId: "not-a-uuid", status: "approved" })
    expect(res.status).toBe(400)
    expect(processVerification).not.toHaveBeenCalled()
  })

  it("answers 403 when the service refuses the actor (assertAdmin)", async () => {
    processVerification.mockRejectedValue(new AdminForbiddenError())
    const res = await post({ userId: UID, status: "approved" })
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: "Acesso negado", code: "FORBIDDEN" })
  })

  it("answers 404 when the profile does not exist", async () => {
    processVerification.mockRejectedValue(new VerificationProfileNotFoundError())
    const res = await post({ userId: UID, status: "approved" })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Perfil não encontrado" })
  })

  it("passes the parsed body and the admin id to the service and returns its result", async () => {
    processVerification.mockResolvedValue({ success: true, chatSent: true, emailSent: false })
    const res = await post({ userId: UID, status: "rejected", notes: "foto", notifyEmail: false })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, chatSent: true, emailSent: false })
    expect(processVerification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: UID, status: "rejected", notes: "foto", notifyEmail: false, adminId: "admin-1" })
    )
  })

  it("hides internal error messages behind a fixed 500", async () => {
    processVerification.mockRejectedValue(new Error("duplicate key value violates ..."))
    const res = await post({ userId: UID, status: "approved" })
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: "Erro interno do servidor" })
  })
})
