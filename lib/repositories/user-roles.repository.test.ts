import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createRolesCatalog, createUserRolesRepository } from "./user-roles.repository"
import { ProfileRepositoryError } from "./profile.repository"

type Result = { data?: unknown; error: { message: string } | null }

function fakeClient(opts: { existing?: unknown; result?: Result } = {}) {
  const result = opts.result ?? { data: [], error: null }
  const query = {
    select: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn(async () => result),
    maybeSingle: jest.fn(async () => ({ data: opts.existing ?? null, error: null })),
    insert: jest.fn(async () => result),
  }
  const client = { from: jest.fn(() => query) }
  return { client: client as unknown as SupabaseClient<Database>, query }
}

describe("roles catalog", () => {
  it("looks up the roles by name", async () => {
    const { client, query } = fakeClient({ result: { data: [{ id: 1, name: "mentee" }], error: null } })
    expect(await createRolesCatalog(client).findByNames(["mentor", "mentee"])).toEqual([{ id: 1, name: "mentee" }])
    expect(client.from).toHaveBeenCalledWith("roles")
    expect(query.in).toHaveBeenCalledWith("name", ["mentor", "mentee"])
  })

  it("wraps driver errors", async () => {
    const { client } = fakeClient({ result: { error: { message: "boom" } } })
    await expect(createRolesCatalog(client).findByNames(["mentor"])).rejects.toBeInstanceOf(ProfileRepositoryError)
  })
})

describe("user roles repository", () => {
  it("does not create the privileged client until something is written", async () => {
    const getDb = jest.fn()
    createUserRolesRepository(getDb)
    expect(getDb).not.toHaveBeenCalled()
  })

  it("removes the given roles of that user only", async () => {
    const { client, query } = fakeClient()
    await createUserRolesRepository(() => client).remove("u1", [2])
    expect(client.from).toHaveBeenCalledWith("user_roles")
    expect(query.eq).toHaveBeenCalledWith("user_id", "u1")
    expect(query.in).toHaveBeenCalledWith("role_id", [2])
  })

  it("skips the query when there is nothing to remove", async () => {
    const getDb = jest.fn()
    await createUserRolesRepository(getDb).remove("u1", [])
    expect(getDb).not.toHaveBeenCalled()
  })

  it("inserts when the row is missing and reports it", async () => {
    const { client, query } = fakeClient()
    expect(await createUserRolesRepository(() => client).addIfMissing("u1", 1)).toBe(true)
    expect(query.insert).toHaveBeenCalledWith({ user_id: "u1", role_id: 1 })
  })

  it("does not insert a duplicate (user_roles has no unique constraint)", async () => {
    const { client, query } = fakeClient({ existing: { id: "row" } })
    expect(await createUserRolesRepository(() => client).addIfMissing("u1", 1)).toBe(false)
    expect(query.insert).not.toHaveBeenCalled()
  })
})
