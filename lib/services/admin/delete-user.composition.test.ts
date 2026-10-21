/**
 * @jest-environment node
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { AdminForbiddenError } from "./assert-admin"
import { AdminSelfActionError } from "./self-action.error"
import { buildAdminDeleteUser } from "./delete-user.composition"
import { createAdminDeleteUser } from "./delete-user.service"

jest.mock("@/lib/utils/supabase/service-role", () => ({
  createServiceRoleClient: jest.fn(),
  ensureServerSide: jest.fn(),
}))

jest.mock("@/lib/services/invites/suppression.service", () => ({
  hashEmail: jest.fn((email: string) => `hash(${email})`),
  suppress: jest.fn().mockResolvedValue(undefined),
}))

const session = (isAdmin: boolean | "error") =>
  ({
    rpc: jest.fn(async () =>
      isAdmin === "error" ? { data: null, error: { message: "rpc down" } } : { data: isAdmin, error: null }
    ),
  }) as unknown as SupabaseClient<Database>

describe("admin delete user", () => {
  beforeEach(() => jest.clearAllMocks())

  it.each([[false], ["error" as const]])("refuses a non-admin (%s) before any deletion", async (state) => {
    const deleteUser = jest.fn()
    const run = createAdminDeleteUser({ session: session(state), deleteUser })
    await expect(run("admin-1", "u1")).rejects.toBeInstanceOf(AdminForbiddenError)
    expect(deleteUser).not.toHaveBeenCalled()
  })

  it("refuses to delete the admin's own account", async () => {
    const deleteUser = jest.fn()
    const run = createAdminDeleteUser({ session: session(true), deleteUser })
    await expect(run("admin-1", "admin-1")).rejects.toBeInstanceOf(AdminSelfActionError)
    expect(deleteUser).not.toHaveBeenCalled()
  })

  it("deletes with source 'admin' and returns the result", async () => {
    const deleteUser = jest.fn().mockResolvedValue({ success: true, filesRemoved: 2 })
    const run = createAdminDeleteUser({ session: session(true), deleteUser })
    expect(await run("admin-1", "u1")).toEqual({ success: true, filesRemoved: 2 })
    expect(deleteUser).toHaveBeenCalledWith("u1", { source: "admin" })
  })
})

describe("buildAdminDeleteUser (composition)", () => {
  beforeEach(() => jest.clearAllMocks())

  it("does not create the service-role client when the actor is refused", async () => {
    const run = buildAdminDeleteUser(session(false))
    await expect(run("admin-1", "u1")).rejects.toBeInstanceOf(AdminForbiddenError)
    expect(createServiceRoleClient).not.toHaveBeenCalled()
  })

  it("does not create the service-role client for a self-delete", async () => {
    const run = buildAdminDeleteUser(session(true))
    await expect(run("admin-1", "admin-1")).rejects.toBeInstanceOf(AdminSelfActionError)
    expect(createServiceRoleClient).not.toHaveBeenCalled()
  })

  it("creates the privileged client only after the admin check passes", async () => {
    const profileMissing = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({ maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) }),
      }),
      delete: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
    }
    const menteeMissing = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({ maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) }),
      }),
    }
    const privileged = {
      from: jest.fn((table: string) => (table === "profiles" ? profileMissing : menteeMissing)),
      storage: {
        from: jest.fn(() => ({ list: jest.fn().mockResolvedValue({ data: [], error: null }), remove: jest.fn() })),
      },
      auth: { admin: { deleteUser: jest.fn().mockResolvedValue({ error: null }) } },
    }
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(privileged)

    const result = await buildAdminDeleteUser(session(true))("admin-1", "u1")

    expect(createServiceRoleClient).toHaveBeenCalledTimes(1)
    expect(privileged.auth.admin.deleteUser).toHaveBeenCalledWith("u1")
    expect(result).toEqual({ success: true, filesRemoved: 0 })
  })
})
