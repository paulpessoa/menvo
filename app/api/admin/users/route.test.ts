/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from "next/server"
import { GET } from "./route"
import { requireAdmin } from "@/lib/auth/require-admin"
import { createClient } from "@/lib/utils/supabase/server"
import { buildAdminUsersService } from "@/lib/services/admin/users.composition"
import { AdminForbiddenError } from "@/lib/services/admin/assert-admin"

jest.mock("@/lib/auth/require-admin", () => ({ requireAdmin: jest.fn() }))
jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn() }))
jest.mock("@/lib/services/admin/users.composition", () => ({ buildAdminUsersService: jest.fn() }))

const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>
const mockBuild = buildAdminUsersService as jest.MockedFunction<typeof buildAdminUsersService>
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

const listUsers = jest.fn()
const get = (qs = "") => GET(new NextRequest(`http://localhost:3000/api/admin/users${qs}`))

describe("GET /api/admin/users", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateClient.mockResolvedValue({} as never)
    mockBuild.mockReturnValue({ listUsers } as never)
    mockRequireAdmin.mockResolvedValue({ ok: true, admin: { userId: "admin-1", role: "admin" } })
  })

  it("returns the guard's 401/403 without building the service", async () => {
    mockRequireAdmin.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "Acesso negado" }, { status: 403 }),
    })
    const res = await get()
    expect(res.status).toBe(403)
    expect(mockBuild).not.toHaveBeenCalled()
  })

  it("answers 403 when the service refuses the actor (assertAdmin)", async () => {
    listUsers.mockRejectedValue(new AdminForbiddenError())
    const res = await get()
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: "Acesso negado", code: "FORBIDDEN" })
  })

  it("parses the query (limit capped at 100) and wraps the result in data", async () => {
    const payload = { users: [], pagination: { page: 2, limit: 100, total: 0, totalPages: 0 }, counts: {} }
    listUsers.mockResolvedValue(payload)

    const res = await get("?page=2&limit=9999&role=mentor&sort_order=bogus")

    expect(res.status).toBe(200)
    expect((await res.json()).data).toEqual(payload)
    expect(listUsers).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 100, role: "mentor", sort_order: "desc" })
    )
  })

  it("answers 500 when the service fails unexpectedly", async () => {
    listUsers.mockRejectedValue(new Error("boom"))
    jest.spyOn(console, "error").mockImplementation(() => undefined)
    const res = await get()
    expect(res.status).toBe(500)
  })
})
