/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { AdminForbiddenError } from "@/lib/services/admin/assert-admin"
import { FeedbackNotFoundError } from "@/lib/services/admin/feedbacks.service"
import { GET, PATCH } from "./route"

jest.mock("@/lib/auth/require-admin", () => ({ requireAdmin: jest.fn() }))
jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn().mockResolvedValue({}) }))

const service = { listPending: jest.fn(), moderate: jest.fn() }
jest.mock("@/lib/services/admin/ops.composition", () => ({
  buildAdminFeedbacksService: () => service
}))

const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>
const ID = "11111111-1111-4111-8111-111111111111"
const patch = (body: unknown) =>
  new NextRequest("http://localhost/api/admin/feedbacks", { method: "PATCH", body: JSON.stringify(body) })

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
  mockRequireAdmin.mockResolvedValue({ ok: true, admin: { userId: "admin-1", role: "admin" } })
})

describe("/api/admin/feedbacks", () => {
  it("returns the guard response for a non-admin", async () => {
    mockRequireAdmin.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    })
    expect((await GET()).status).toBe(403)
    expect((await PATCH(patch({ feedbackId: ID, status: "approved" }))).status).toBe(403)
    expect(service.moderate).not.toHaveBeenCalled()
  })

  it("GET keeps the { data } shape", async () => {
    service.listPending.mockResolvedValue([{ id: ID }])
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ data: [{ id: ID }] })
  })

  it("PATCH rejects invalid input with 400 and never calls the service", async () => {
    expect((await PATCH(patch({ feedbackId: "x", status: "approved" }))).status).toBe(400)
    expect((await PATCH(patch({ feedbackId: ID, status: "pending" }))).status).toBe(400)
    expect(service.moderate).not.toHaveBeenCalled()
  })

  it("PATCH keeps the success shape and passes the admin id", async () => {
    service.moderate.mockResolvedValue({ id: ID, status: "approved" })
    const res = await PATCH(patch({ feedbackId: ID, status: "approved" }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      data: { id: ID, status: "approved" },
      message: "Feedback moderado com sucesso"
    })
    expect(service.moderate).toHaveBeenCalledWith("admin-1", { feedbackId: ID, status: "approved" })
  })

  it("maps service 403 and 404, and hides database errors", async () => {
    service.moderate.mockRejectedValueOnce(new AdminForbiddenError())
    expect((await PATCH(patch({ feedbackId: ID, status: "approved" }))).status).toBe(403)
    service.moderate.mockRejectedValueOnce(new FeedbackNotFoundError())
    expect((await PATCH(patch({ feedbackId: ID, status: "approved" }))).status).toBe(404)
    service.listPending.mockRejectedValueOnce(new Error("relation secret_table"))
    const res = await GET()
    expect(res.status).toBe(500)
    expect(JSON.stringify(await res.json())).not.toContain("secret_table")
  })
})
