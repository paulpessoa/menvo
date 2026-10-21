/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from "next/server"
import { GET, POST } from "./route"
import { requireAdmin } from "@/lib/auth/require-admin"
import { buildAdminOrganizationsService } from "@/lib/services/admin/ops.composition"
import { AdminForbiddenError } from "@/lib/services/admin/assert-admin"

jest.mock("@/lib/auth/require-admin", () => ({ requireAdmin: jest.fn() }))
jest.mock("@/lib/utils/supabase/server", () => ({
  createClient: jest.fn().mockResolvedValue({})
}))
jest.mock("@/lib/services/admin/ops.composition", () => ({
  buildAdminOrganizationsService: jest.fn()
}))

const service = { listOrganizations: jest.fn(), createOrganization: jest.fn() }

const post = (body: unknown) =>
  new NextRequest("http://localhost/api/admin/organizations", {
    method: "POST",
    body: JSON.stringify(body)
  })

beforeEach(() => {
  jest.clearAllMocks()
  ;(buildAdminOrganizationsService as jest.Mock).mockReturnValue(service)
  ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: true, admin: { userId: "a1" } })
  jest.spyOn(console, "error").mockImplementation(() => undefined)
})

describe("/api/admin/organizations", () => {
  it("GET returns the guard response for a non-admin", async () => {
    ;(requireAdmin as jest.Mock).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 })
    })
    expect((await GET()).status).toBe(403)
    expect(service.listOrganizations).not.toHaveBeenCalled()
  })

  it("GET wraps the list in the usual { data } envelope", async () => {
    service.listOrganizations.mockResolvedValue([{ id: "o1", member_count: 2 }])
    const res = await GET()
    expect(res.status).toBe(200)
    expect((await res.json()).data).toEqual([{ id: "o1", member_count: 2 }])
  })

  it("GET refuses when the service denies the actor", async () => {
    service.listOrganizations.mockRejectedValue(new AdminForbiddenError())
    expect((await GET()).status).toBe(403)
  })

  it("GET hides the database message", async () => {
    service.listOrganizations.mockRejectedValue(new Error("relation organizations missing"))
    const res = await GET()
    expect(res.status).toBe(500)
    expect(JSON.stringify(await res.json())).not.toContain("relation")
  })

  it("POST rejects an invalid body with 400", async () => {
    const res = await POST(post({ name: "x" }))
    expect(res.status).toBe(400)
    expect(service.createOrganization).not.toHaveBeenCalled()
  })

  it("POST answers 409 for a taken slug", async () => {
    service.createOrganization.mockResolvedValue({ kind: "slug_taken" })
    const res = await POST(post({ name: "Org", slug: "org", type: "ngo" }))
    expect(res.status).toBe(409)
  })

  it("POST creates the organization", async () => {
    service.createOrganization.mockResolvedValue({ kind: "created", organization: { id: "o1" } })
    const res = await POST(post({ name: "Org", slug: "org", type: "ngo" }))
    expect(res.status).toBe(200)
    expect((await res.json()).data).toEqual({ id: "o1" })
  })
})
