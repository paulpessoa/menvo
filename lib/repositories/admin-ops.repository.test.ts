/**
 * @jest-environment node
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import {
  createAdminRetentionReadRepository,
  createAdminRetentionWriteRepository
} from "./admin-ops.repository"
import { RepositoryError } from "./repository-error"

/** Thenable query builder: every call returns itself, awaiting yields `result`. */
function builder(result: unknown) {
  const calls: Record<string, unknown[][]> = {}
  const proxy: unknown = new Proxy(
    {},
    {
      get(_t, prop: string) {
        if (prop === "then") return (resolve: (v: unknown) => unknown) => resolve(result)
        return (...args: unknown[]) => {
          ;(calls[prop] ||= []).push(args)
          return proxy
        }
      }
    }
  )
  return { proxy, calls }
}

function dbWith(result: unknown) {
  const q = builder(result)
  const db = { from: jest.fn(() => q.proxy) } as unknown as SupabaseClient<Database>
  return { db, calls: q.calls }
}

describe("createAdminRetentionReadRepository", () => {
  it("lists the retention queue oldest first with the profile embedded", async () => {
    const rows = [{ user_id: "u1", profile: { email: "a@b.c", full_name: "A", email_opt_out_at: null } }]
    const { db, calls } = dbWith({ data: rows, error: null })
    expect(await createAdminRetentionReadRepository(db).listRetentionQueue()).toEqual(rows)
    expect(db.from).toHaveBeenCalledWith("account_retention")
    expect(calls.order).toEqual([["clock_started_at", { ascending: true }]])
  })

  it("lists the inactive queue by nearest deletion", async () => {
    const { db, calls } = dbWith({ data: null, error: null })
    expect(await createAdminRetentionReadRepository(db).listInactiveQueue()).toEqual([])
    expect(db.from).toHaveBeenCalledWith("inactive_accounts_queue")
    expect(calls.order).toEqual([["scheduled_deletion_at", { ascending: true }]])
  })

  it("wraps a driver error without leaking its message to callers' responses", async () => {
    const { db } = dbWith({ data: null, error: { message: "column x" } })
    await expect(createAdminRetentionReadRepository(db).listRetentionQueue()).rejects.toBeInstanceOf(
      RepositoryError
    )
  })
})

describe("createAdminRetentionWriteRepository", () => {
  it("flips the origin to menvo for that user only", async () => {
    const { db, calls } = dbWith({ error: null })
    await createAdminRetentionWriteRepository(db).markAsNativeUser("u1")
    expect(db.from).toHaveBeenCalledWith("import_records")
    expect(calls.update?.[0]?.[0]).toMatchObject({ origin_platform: "menvo" })
    expect(calls.eq).toEqual([["user_id", "u1"]])
  })

  it("removes the user from the retention queue", async () => {
    const { db, calls } = dbWith({ error: null })
    await createAdminRetentionWriteRepository(db).removeFromRetentionQueue("u1")
    expect(db.from).toHaveBeenCalledWith("account_retention")
    expect(calls.delete).toHaveLength(1)
    expect(calls.eq).toEqual([["user_id", "u1"]])
  })

  it("throws RepositoryError on failure", async () => {
    const { db } = dbWith({ error: { message: "denied" } })
    await expect(createAdminRetentionWriteRepository(db).markAsNativeUser("u1")).rejects.toBeInstanceOf(
      RepositoryError
    )
  })
})
