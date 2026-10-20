/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from "next/server"
import { DELETE, PATCH } from "./route"
import { requireAdmin } from "@/lib/auth/require-admin"
import { createClient } from "@/lib/utils/supabase/server"
import { buildAdminUsersService } from "@/lib/services/admin/users.composition"
import { buildAdminDeleteUser } from "@/lib/services/admin/delete-user.composition"
import { AdminForbiddenError } from "@/lib/services/admin/assert-admin"
import { AdminSelfActionError } from "@/lib/services/admin/self-action.error"

jest.mock("@/lib/auth/require-admin", () => ({ requireAdmin: jest.fn() }))
jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn() }))
jest.mock("@/lib/services/admin/users.composition", () => ({ buildAdminUsersService: jest.fn() }))
jest.mock("@/lib/services/admin/delete-user.composition", () => ({ buildAdminDeleteUser: jest.fn() }))

const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>
const mockBuild = buildAdminUsersService as jest.MockedFunction<typeof buildAdminUsersService>
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

const UID = "123e4567-e89b-42d3-a456-426614174000"
const updateUser = jest.fn()

const patch = (body: unknown) =>
  PATCH(
    new NextRequest(`http://localhost:3000/api/admin/users/${UID}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: UID }) }
  )

describe("PATCH /api/admin/users/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, "error").mockImplementation(() => undefined)
    mockCreateClient.mockResolvedValue({} as never)
    mockBuild.mockReturnValue({ updateUser } as never)
    mockRequireAdmin.mockResolvedValue({ ok: true, admin: { userId: "admin-1", role: "admin" } })
  })

  it("returns the guard's 401/403 without building the service", async () => {
    mockRequireAdmin.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "Acesso negado" }, { status: 403 }),
    })
    const res = await patch({ updates: {} })
    expect(res.status).toBe(403)
    expect(mockBuild).not.toHaveBeenCalled()
  })

  it("answers 400 for an invalid body (unknown role)", async () => {
    const res = await patch({ roles: ["moderator"] })
    expect(res.status).toBe(400)
    expect(updateUser).not.toHaveBeenCalled()
  })

  it("passes the actor, the target and the parsed body to the service", async () => {
    updateUser.mockResolvedValue({ id: UID, first_name: "Ana" })
    const res = await patch({ updates: { first_name: "Ana", is_admin: true }, roles: ["mentor"] })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, data: { id: UID, first_name: "Ana" } })
    expect(updateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "admin-1",
        targetId: UID,
        body: { updates: { first_name: "Ana" }, roles: ["mentor"] },
      })
    )
  })

  it("answers 403 when the service refuses the actor (assertAdmin)", async () => {
    updateUser.mockRejectedValue(new AdminForbiddenError())
    const res = await patch({ updates: {} })
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: "Acesso negado", code: "FORBIDDEN" })
  })

  it("answers 400 when the admin tries to drop their own admin role", async () => {
    updateUser.mockRejectedValue(new AdminSelfActionError("Você não pode retirar o próprio papel de administrador"))
    const res = await patch({ roles: ["mentor"] })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/próprio papel/)
  })

  it("answers 500 with a fixed message, never the database error", async () => {
    updateUser.mockRejectedValue(new Error('relation "profiles" violates constraint x'))
    const res = await patch({ updates: {} })
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: "Erro ao atualizar usuário" })
  })
})

describe("DELETE /api/admin/users/[id]", () => {
  const run = jest.fn()
  const del = () =>
    DELETE(new NextRequest(`http://localhost:3000/api/admin/users/${UID}`, { method: "DELETE" }), {
      params: Promise.resolve({ id: UID }),
    })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, "error").mockImplementation(() => undefined)
    mockCreateClient.mockResolvedValue({} as never)
    ;(buildAdminDeleteUser as jest.Mock).mockReturnValue(run)
    mockRequireAdmin.mockResolvedValue({ ok: true, admin: { userId: "admin-1", role: "admin" } })
  })

  it("returns the guard's 401/403 without building the service", async () => {
    mockRequireAdmin.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "Acesso negado" }, { status: 403 }),
    })
    expect((await del()).status).toBe(403)
    expect(buildAdminDeleteUser).not.toHaveBeenCalled()
  })

  it("deletes through the service with actor and target", async () => {
    run.mockResolvedValue({ success: true, filesRemoved: 3 })
    const res = await del()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, message: "Usuário removido permanentemente", filesRemoved: 3 })
    expect(run).toHaveBeenCalledWith("admin-1", UID)
  })

  it("answers 403 when the service refuses the actor (assertAdmin)", async () => {
    run.mockRejectedValue(new AdminForbiddenError())
    expect((await del()).status).toBe(403)
  })

  it("answers 400 when the admin targets their own account", async () => {
    run.mockRejectedValue(new AdminSelfActionError("Você não pode remover a própria conta de administrador"))
    const res = await del()
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/própria conta/)
  })

  it("answers 500 with a fixed message", async () => {
    run.mockRejectedValue(new Error("auth.users FK violation"))
    const res = await del()
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: "Erro ao remover usuário" })
  })
})
