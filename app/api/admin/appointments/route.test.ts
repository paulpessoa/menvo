/**
 * @jest-environment node
 */
import { NextResponse } from "next/server"
import { GET } from "./route"
import { requireAdmin } from "@/lib/auth/require-admin"
import { listAdminAppointments, AdminAppointmentError } from "@/lib/services/appointments/admin-appointments.service"

jest.mock("@/lib/auth/require-admin", () => ({ requireAdmin: jest.fn() }))
jest.mock("@/lib/utils/supabase/service-role", () => ({ createServiceRoleClient: jest.fn(() => ({ fake: true })) }))
jest.mock("@/lib/services/appointments/admin-appointments.service", () => ({
  ...jest.requireActual("@/lib/services/appointments/admin-appointments.service"),
  listAdminAppointments: jest.fn()
}))

const req = (qs = "") => new Request(`http://localhost/api/admin/appointments${qs}`)

describe("GET /api/admin/appointments", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: true, admin: { userId: "admin-1", role: "admin" } })
  })

  it("returns the guard response untouched when the caller is not an admin", async () => {
    ;(requireAdmin as jest.Mock).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "Acesso negado", code: "FORBIDDEN" }, { status: 403 })
    })

    const res = await GET(req())
    expect(res.status).toBe(403)
    expect(listAdminAppointments).not.toHaveBeenCalled()
  })

  it("passes status and q filters to the service", async () => {
    ;(listAdminAppointments as jest.Mock).mockResolvedValue({ appointments: [], counts: { all: 0 }, total: 0, truncated: false })

    const res = await GET(req("?status=pending&q=maria"))

    expect(res.status).toBe(200)
    expect(listAdminAppointments).toHaveBeenCalledWith({ fake: true }, { status: "pending", q: "maria" })
    expect(await res.json()).toMatchObject({ total: 0, truncated: false })
  })

  it("maps service errors to their HTTP status", async () => {
    ;(listAdminAppointments as jest.Mock).mockRejectedValue(new AdminAppointmentError("falhou", 500, "QUERY_FAILED"))
    const res = await GET(req())
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: "falhou", code: "QUERY_FAILED" })
  })

  it("hides unexpected error details", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {})
    ;(listAdminAppointments as jest.Mock).mockRejectedValue(new Error("connection string postgres://secret"))
    const res = await GET(req())
    expect(res.status).toBe(500)
    expect(JSON.stringify(await res.json())).not.toContain("secret")
  })
})
