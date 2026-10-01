/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from "next/server"
import { POST } from "./route"
import { requireAdmin } from "@/lib/auth/require-admin"
import { logAdminAction } from "@/lib/audit-logger"
import {
  AdminAppointmentError,
  resendConfirmation,
  resendMentorRequest
} from "@/lib/services/appointments/admin-appointments.service"

jest.mock("@/lib/auth/require-admin", () => ({ requireAdmin: jest.fn() }))
jest.mock("@/lib/audit-logger", () => ({ logAdminAction: jest.fn() }))
jest.mock("@/lib/utils/supabase/service-role", () => ({ createServiceRoleClient: jest.fn(() => ({ fake: true })) }))
jest.mock("@/lib/services/appointments/admin-appointments.service", () => ({
  ...jest.requireActual("@/lib/services/appointments/admin-appointments.service"),
  resendMentorRequest: jest.fn(),
  resendConfirmation: jest.fn()
}))

const ID = "11111111-1111-4111-8111-111111111111"
const call = (body: unknown, id = ID) =>
  POST(
    new NextRequest(`http://localhost/api/admin/appointments/${id}/resend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }),
    { params: Promise.resolve({ id }) }
  )

describe("POST /api/admin/appointments/:id/resend", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: true, admin: { userId: "admin-1", role: "admin" } })
  })

  it("blocks non-admins before touching anything", async () => {
    ;(requireAdmin as jest.Mock).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "Não autenticado", code: "UNAUTHORIZED" }, { status: 401 })
    })
    const res = await call({ target: "mentor_request" })
    expect(res.status).toBe(401)
    expect(resendMentorRequest).not.toHaveBeenCalled()
    expect(resendConfirmation).not.toHaveBeenCalled()
  })

  it("rejects a malformed id", async () => {
    const res = await call({ target: "mentor_request" }, "not-a-uuid")
    expect(res.status).toBe(400)
    expect(resendMentorRequest).not.toHaveBeenCalled()
  })

  it.each([{}, { target: "everyone" }, { target: 1 }])("rejects an invalid body %p", async body => {
    const res = await call(body)
    expect(res.status).toBe(400)
  })

  it("resends the mentor request and writes an audit entry", async () => {
    ;(resendMentorRequest as jest.Mock).mockResolvedValue({ sentTo: "bianca@example.com", tokenRenewed: true })

    const res = await call({ target: "mentor_request" })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, target: "mentor_request", sentTo: "bianca@example.com", tokenRenewed: true })
    expect(resendMentorRequest).toHaveBeenCalledWith({ fake: true }, ID)
    expect(logAdminAction).toHaveBeenCalledWith(
      "admin-1",
      "appointment_resend",
      expect.objectContaining({ appointment_id: ID, target: "mentor_request", sentTo: "bianca@example.com" }),
      undefined,
      undefined,
      expect.anything()
    )
  })

  it("resends the confirmation", async () => {
    ;(resendConfirmation as jest.Mock).mockResolvedValue({ sentTo: ["a@x.com", "b@x.com"] })
    const res = await call({ target: "confirmation" })
    expect(res.status).toBe(200)
    expect(resendConfirmation).toHaveBeenCalledWith({ fake: true }, ID)
    expect(resendMentorRequest).not.toHaveBeenCalled()
  })

  it("does not audit a failed resend and maps the status", async () => {
    ;(resendMentorRequest as jest.Mock).mockRejectedValue(new AdminAppointmentError("já confirmada", 409, "INVALID_STATUS"))
    const res = await call({ target: "mentor_request" })
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: "já confirmada", code: "INVALID_STATUS" })
    expect(logAdminAction).not.toHaveBeenCalled()
  })
})
