import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { COMMUNITY_COLUMNS, createCommunityRepository } from "./community.repository"
import { RepositoryError } from "./repository-error"

function fakeClient(result: { data: unknown; error: { message: string } | null; count?: number }) {
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    overlaps: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn(async () => result),
    then: (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve),
  }
  const client = { from: jest.fn(() => query) }
  return { client: client as unknown as SupabaseClient<Database>, query }
}

const row = { id: "p1", full_name: "Ana", mentee_profiles: { learning_goals: "dados" } }

describe("community repository", () => {
  it("never selects sensitive columns", () => {
    expect(COMMUNITY_COLUMNS).not.toMatch(/\b(email|phone|age|address|original_data)\b/)
  })

  it("findByIds reads only the community columns and flattens the mentee embed", async () => {
    const { client, query } = fakeClient({ data: [row], error: null })
    const [profile] = await createCommunityRepository(client).findByIds(["p1"])
    expect(client.from).toHaveBeenCalledWith("profiles")
    expect(query.select).toHaveBeenCalledWith(COMMUNITY_COLUMNS)
    expect(query.in).toHaveBeenCalledWith("id", ["p1"])
    expect(profile).toMatchObject({ id: "p1", role: "mentee", learning_goals: "dados" })
  })

  it("findByIds skips the database for an empty list", async () => {
    const { client } = fakeClient({ data: [], error: null })
    expect(await createCommunityRepository(client).findByIds([])).toEqual([])
    expect(client.from).not.toHaveBeenCalled()
  })

  it("findByIds throws RepositoryError on failure", async () => {
    const { client } = fakeClient({ data: null, error: { message: "boom" } })
    await expect(createCommunityRepository(client).findByIds(["p1"])).rejects.toBeInstanceOf(RepositoryError)
  })

  it("searchMentees excludes mentors, applies the range and returns the count", async () => {
    const { client, query } = fakeClient({ data: [row], error: null, count: 7 })
    const out = await createCommunityRepository(client).searchMentees({ from: 0, to: 11, sortBy: "name" }, ["m1", "m2"])
    expect(query.eq).toHaveBeenCalledWith("is_public", true)
    expect(query.not).toHaveBeenCalledWith("id", "in", "(m1,m2)")
    expect(query.order).toHaveBeenCalledWith("full_name", { ascending: true })
    expect(query.range).toHaveBeenCalledWith(0, 11)
    expect(out.totalCount).toBe(7)
  })

  it("listMentorIds degrades to an empty list on error", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {})
    const { client } = fakeClient({ data: null, error: { message: "x" } })
    expect(await createCommunityRepository(client).listMentorIds()).toEqual([])
    warn.mockRestore()
  })
})