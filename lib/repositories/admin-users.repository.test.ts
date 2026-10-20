import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { adminUsersQuerySchema } from "@/lib/schemas/admin-users"
import { createAdminUserCvReader, createAdminUsersReader } from "./admin-users.repository"
import { RepositoryError } from "./repository-error"

type Result = { data?: unknown; error?: { message: string } | null; count?: number | null }

function fakeClient(result: Result) {
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    then: (resolve: (v: unknown) => unknown) => Promise.resolve({ error: null, ...result }).then(resolve),
  }
  const client = { from: jest.fn(() => query) }
  return { client: client as unknown as SupabaseClient<Database>, query }
}

const parse = (raw: Record<string, string> = {}) => adminUsersQuerySchema.parse(raw)

describe("admin users reader", () => {
  it("pages with range and orders by the requested column", async () => {
    const { client, query } = fakeClient({ data: [{ id: "u1" }], count: 41 })
    const page = await createAdminUsersReader(client).list(parse({ page: "3", limit: "10", sort_by: "full_name", sort_order: "asc" }))

    expect(query.range).toHaveBeenCalledWith(20, 29)
    expect(query.order).toHaveBeenCalledWith("full_name", { ascending: true })
    expect(page).toEqual({ rows: [{ id: "u1" }], total: 41 })
  })

  it("uses !inner embeds and filters when role, status and jotform origin are set", async () => {
    const { client, query } = fakeClient({ data: [], count: 0 })
    await createAdminUsersReader(client).list(parse({ role: "mentor", status: "pending", origin: "jotform", search: "ana" }))

    const select = query.select.mock.calls[0][0] as string
    expect(select).toContain("user_roles!inner")
    expect(select).toContain("mentor_profiles!inner(")
    expect(select).toContain("import_records!inner")
    expect(query.eq).toHaveBeenCalledWith("user_roles.roles.name", "mentor")
    expect(query.eq).toHaveBeenCalledWith("mentor_profiles.verification_status", "pending")
    expect(query.eq).toHaveBeenCalledWith("import_records.origin_platform", "jotform")
    expect(query.or).toHaveBeenCalledWith("full_name.ilike.%ana%,email.ilike.%ana%")
  })

  it("maps the 'menvo' origin to profiles with no import record", async () => {
    const { client, query } = fakeClient({ data: [], count: 0 })
    await createAdminUsersReader(client).list(parse({ origin: "menvo" }))
    expect(query.is).toHaveBeenCalledWith("import_records", null)
  })

  it("wraps driver errors in RepositoryError", async () => {
    const { client } = fakeClient({ data: null, error: { message: "boom" } })
    await expect(createAdminUsersReader(client).list(parse())).rejects.toBeInstanceOf(RepositoryError)
  })

  it("reads the six tab counts, defaulting null to 0", async () => {
    const { client } = fakeClient({ count: null })
    expect(await createAdminUsersReader(client).counts()).toEqual({
      all: 0,
      pending: 0,
      mentors: 0,
      mentees: 0,
      menvoOrigin: 0,
      jotformOrigin: 0,
    })
  })
})

describe("admin user cv reader", () => {
  it("does not create the privileged client when there are no ids", async () => {
    const getDb = jest.fn()
    expect(await createAdminUserCvReader(getDb).findStoredCvUrls([])).toEqual([])
    expect(getDb).not.toHaveBeenCalled()
  })

  it("returns only rows that have a stored cv", async () => {
    const { client } = fakeClient({ data: [{ user_id: "u1", cv_url: "u1/cv-1.pdf" }] })
    const rows = await createAdminUserCvReader(() => client).findStoredCvUrls(["u1", "u2"])
    expect(rows).toEqual([{ user_id: "u1", cv_url: "u1/cv-1.pdf" }])
  })
})
