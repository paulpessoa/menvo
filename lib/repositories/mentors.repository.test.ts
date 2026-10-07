import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createMentorsRepository } from "./mentors.repository"
import { RepositoryError } from "./repository-error"

function fakeClient(result: { data: unknown; error: { message: string } | null }) {
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn(async () => result),
    then: (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve),
  }
  const client = { from: jest.fn(() => query) }
  return { client: client as unknown as SupabaseClient<Database>, query }
}

describe("mentors repository", () => {
  it("applies the directory filter and looks up by slug", async () => {
    const { client, query } = fakeClient({ data: { id: "m1" }, error: null })
    await createMentorsRepository(client).findPublicBySlugOrId("ana-souza")
    expect(query.eq).toHaveBeenCalledWith("verified", true)
    expect(query.eq).toHaveBeenCalledWith("is_public", true)
    expect(query.eq).toHaveBeenCalledWith("slug", "ana-souza")
  })

  it("looks up by id when given a uuid", async () => {
    const { client, query } = fakeClient({ data: null, error: null })
    const id = "6f1c2a4e-1b2c-4d3e-9f00-0123456789ab"
    expect(await createMentorsRepository(client).findApproachBySlugOrId(id)).toBeNull()
    expect(query.eq).toHaveBeenCalledWith("id", id)
  })

  it("never selects contact columns for the public profile", async () => {
    const { client, query } = fakeClient({ data: null, error: null })
    await createMentorsRepository(client).findPublicBySlugOrId("ana")
    const columns = query.select.mock.calls[0][0] as string
    expect(columns).not.toMatch(/\b(email|phone|external_id)\b/)
  })

  it("skips the query when there are no names to resolve", async () => {
    const { client, query } = fakeClient({ data: [], error: null })
    expect(await createMentorsRepository(client).findSlugsByNames([])).toEqual([])
    expect(query.select).not.toHaveBeenCalled()
  })

  it("wraps driver errors in RepositoryError", async () => {
    const { client } = fakeClient({ data: null, error: { message: "boom" } })
    await expect(createMentorsRepository(client).findPublicBySlugOrId("ana")).rejects.toBeInstanceOf(RepositoryError)
  })
})
