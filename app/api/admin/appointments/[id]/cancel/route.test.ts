/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from "next/server"
import { POST } from "./route"
import { requireAdmin } from "@/lib/auth/require-admin"
import { logAdminAction } from "@/lib/audit-logger"
import {
  AdminAppointmentError,
  cancelAppointmentAsAdmin
} from "@/lib/services/appointments/admin-appointments.service"

jest.mock("@/lib/auth/require-admin", () => ({ requireAdmin: jest.fn() }))
jest.mock("@/lib/audit-logger", () => ({ logAdminAction: jest.fn() }))
jest.mock("@/lib/utils/supabase/service-role", () => ({ createServiceRoleClient: jest.fn(() => ({ fake: true })) }))
jest.mock("@/lib/services/appointments/admin-appointments.service", () => ({
  ...jest.requireActual("@/lib/services/appointments/admin-appointments.service"),
  cancelAppointmentAsAdmin: jest.fn()
}))

const ID = "11111111-1111-4111-8111-111111111111"
const REASON = "Pedido duplicado para o mesmo horário"
const call = (body: unknown, id = ID) =>
  POST(
    new NextRequest(`http://localhost/api/admin/appointments/${id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }),
    { params: Promise.resolve({ id }) }
  )

describe("POST /api/admin/appointments/:id/cancel", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: true, admin: { userId: "admin-1", role: "admin" } })
  })

  it("blocks non-admins", async () => {
    ;(requireAdmin as jest.Mock).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "Acesso negado", code: "FORBIDDEN" }, { status: 403 })
    })
    const res = await call({ reason: REASON })
    expect(res.status).toBe(403)
    expect(cancelAppointmentAsAdmin).not.toHaveBeenCalled()
  })

  it("rejects a malformed id", async () => {
    expect((await call({ reason: REASON }, "abc")).status).toBe(400)
    expect(cancelAppointmentAsAdmin).not.toHaveBeenCalled()
  })

  it.each([{}, { reason: "" }, { reason: "curto" }, { reason: " ".repeat(30) }])(
    "requires a real reason: rejects %p",
    async body => {
      const res = await call(body)
      expect(res.status).toBe(400)
      expect(cancelAppointmentAsAdmin).not.toHaveBeenCalled()
    }
  )

  it("cancels as the signed-in admin, trims the reason and audits it", async () => {
    ;(cancelAppointmentAsAdmin as jest.Mock).mockResolvedValue({
      calendarEventRemoved: true,
      notified: { mentor: true, mentee: true }
    })

    const res = await call({ reason: `  ${REASON}  ` })

    expect(res.status).toBe(200)
    expect(cancelAppointmentAsAdmin).toHaveBeenCalledWith({ fake: true }, ID, "admin-1", REASON)
    expect(logAdminAction).toHaveBeenCalledWith(
      "admin-1",
      "appointment_cancelled",
      expect.objectContaining({ appointment_id: ID, reason: REASON, calendarEventRemoved: true }),
      undefined,
      undefined,
      expect.anything()
    )
    expect(await res.json()).toMatchObject({ success: true, notified: { mentor: true, mentee: true } })
  })

  it("maps a status conflict and does not audit", async () => {
    ;(cancelAppointmentAsAdmin as jest.Mock).mockRejectedValue(new AdminAppointmentError("mudou", 409, "STATUS_CHANGED"))
    const res = await call({ reason: REASON })
    expect(res.status).toBe(409)
    expect(logAdminAction).not.toHaveBeenCalled()
  })
})
