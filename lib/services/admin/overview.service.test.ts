/**
 * @jest-environment node
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { AdminForbiddenError } from "./assert-admin"
import { getAdminOverview } from "./overview.service"

/** Chainable, awaitable query builder that always resolves to an empty result. */
function emptyQuery(): unknown {
  const proxy: unknown = new Proxy(
    {},
    {
      get(_t, prop: string) {
        if (prop === "then") {
          return (resolve: (v: unknown) => unknown) => resolve({ data: [], count: 0, error: null })
        }
        return () => proxy
      }
    }
  )
  return proxy
}

function fakeDb(isAdmin: boolean) {
  const tables: string[] = []
  const db = {
    rpc: jest.fn().mockResolvedValue({ data: isAdmin, error: null }),
    from: jest.fn((table: string) => {
      tables.push(table)
      return emptyQuery()
    })
  }
  return { db: db as unknown as SupabaseClient<Database>, raw: db, tables }
}

describe("getAdminOverview", () => {
  it("refuses a non-admin before querying anything or creating the privileged client", async () => {
    const session = fakeDb(false)
    const privileged = fakeDb(true)
    const getPrivilegedDb = jest.fn(() => privileged.db)

    await expect(getAdminOverview(session.db, getPrivilegedDb)).rejects.toBeInstanceOf(AdminForbiddenError)
    expect(session.raw.from).not.toHaveBeenCalled()
    expect(getPrivilegedDb).not.toHaveBeenCalled()
  })

  it("reads the inactive queue with the session and only appointments with the privileged client", async () => {
    const session = fakeDb(true)
    const privileged = fakeDb(true)

    const overview = await getAdminOverview(session.db, () => privileged.db, new Date("2026-10-07T12:00:00Z"))

    expect(session.tables).toContain("inactive_accounts_queue")
    expect(session.tables).not.toContain("appointments")
    expect(privileged.tables).toEqual(["appointments"])
    expect(overview.users.total).toBe(0)
  })
})
