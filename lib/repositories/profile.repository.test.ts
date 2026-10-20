import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createProfileRepository, PROFILE_SELECT, ProfileRepositoryError } from "./profile.repository"

type Result = { data: unknown; error: { message: string; code?: string } | null }

function fakeClient(result: Result) {
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn(async () => result),
    single: jest.fn(async () => result),
    then: (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve),
  }
  const client = { from: jest.fn(() => query) }
  return { client: client as unknown as SupabaseClient<Database>, query }
}

describe("profile repository", () => {
  it("reads the own profile with the single select (is_public included)", async () => {
    const { client, query } = fakeClient({ data: { id: "u1" }, error: null })
    await createProfileRepository(client).findOwn("u1")
    expect(client.from).toHaveBeenCalledWith("profiles")
    expect(query.select).toHaveBeenCalledWith(PROFILE_SELECT)
    expect(query.eq).toHaveBeenCalledWith("id", "u1")
    expect(PROFILE_SELECT).toContain("is_public")
    expect(PROFILE_SELECT).toContain("mentor_profiles(")
    expect(PROFILE_SELECT).toContain("mentee_profiles(")
  })

  it("returns null when the profile row does not exist (PGRST116)", async () => {
    const { client } = fakeClient({ data: null, error: { message: "no rows", code: "PGRST116" } })
    expect(await createProfileRepository(client).findOwn("u1")).toBeNull()
  })

  it("throws a ProfileRepositoryError carrying code and raw message", async () => {
    const { client } = fakeClient({ data: null, error: { message: "boom", code: "XX000" } })
    const error = await createProfileRepository(client).findOwn("u1").catch(e => e)
    expect(error).toBeInstanceOf(ProfileRepositoryError)
    expect(error.code).toBe("XX000")
    expect(error.dbMessage).toBe("boom")
  })

  it("updates only the caller's row and fails when the row is missing", async () => {
    const { client, query } = fakeClient({ data: null, error: { message: "no rows", code: "PGRST116" } })
    await expect(createProfileRepository(client).updateProfile("u1", { is_public: false })).rejects.toBeInstanceOf(
      ProfileRepositoryError
    )
    expect(query.update).toHaveBeenCalledWith({ is_public: false })
    expect(query.eq).toHaveBeenCalledWith("id", "u1")
    expect(query.single).toHaveBeenCalled()
  })

  it("updates mentor fields by user_id and upserts mentee fields keyed on user_id", async () => {
    const { client, query } = fakeClient({ data: null, error: null })
    const repo = createProfileRepository(client)
    await repo.updateMentorFields("u1", { is_volunteer: true })
    expect(client.from).toHaveBeenCalledWith("mentor_profiles")
    expect(query.eq).toHaveBeenCalledWith("user_id", "u1")

    await repo.upsertMenteeFields("u1", { course: "BCC" })
    expect(client.from).toHaveBeenCalledWith("mentee_profiles")
    expect(query.upsert).toHaveBeenCalledWith({ user_id: "u1", course: "BCC" }, { onConflict: "user_id" })
  })
})
