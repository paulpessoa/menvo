/**
 * @jest-environment node
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import {
  AdminForbiddenError,
  adminForbiddenResponse,
  assertAdmin
} from "./assert-admin"

const dbWith = (result: { data: unknown; error: unknown }) => {
  const rpc = jest.fn().mockResolvedValue(result)
  return { db: { rpc } as unknown as SupabaseClient<Database>, rpc }
}

describe("assertAdmin", () => {
  it("asks is_admin() through the session client and passes for an admin", async () => {
    const { db, rpc } = dbWith({ data: true, error: null })
    await expect(assertAdmin(db)).resolves.toBeUndefined()
    expect(rpc).toHaveBeenCalledWith("is_admin")
  })

  it("refuses a non-admin", async () => {
    const { db } = dbWith({ data: false, error: null })
    await expect(assertAdmin(db)).rejects.toBeInstanceOf(AdminForbiddenError)
  })

  it("denies by default when the RPC errors", async () => {
    const { db } = dbWith({ data: true, error: { message: "boom" } })
    await expect(assertAdmin(db)).rejects.toBeInstanceOf(AdminForbiddenError)
  })

  it.each([null, undefined, "true", 1])("refuses a non-true answer: %p", async data => {
    const { db } = dbWith({ data, error: null })
    await expect(assertAdmin(db)).rejects.toBeInstanceOf(AdminForbiddenError)
  })
})

describe("adminForbiddenResponse", () => {
  it("turns AdminForbiddenError into the 403 body requireAdmin uses", async () => {
    const res = adminForbiddenResponse(new AdminForbiddenError())
    expect(res?.status).toBe(403)
    expect(await res?.json()).toEqual({ error: "Acesso negado", code: "FORBIDDEN" })
  })

  it("ignores other errors", () => {
    expect(adminForbiddenResponse(new Error("x"))).toBeNull()
  })
})
