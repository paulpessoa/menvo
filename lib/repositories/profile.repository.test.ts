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
    single: jest.fn(async () => result),
    then: (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve),
  }
  const rpc = jest.fn(async () => ({ data: "u1/cv-1.pdf", error: null }))
  const client = { from: jest.fn(() => query), rpc }
  return { client: client as unknown as SupabaseClient<Database>, query, rpc }
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

  it("reads onboarding flags as an object, empty when missing or malformed", async () => {
    const ok = fakeClient({ data: { onboarding_flags: { ob_m1: "x" } }, error: null })
    expect(await createProfileRepository(ok.client).findOnboardingFlags("u1")).toEqual({ ob_m1: "x" })
    expect(ok.query.select).toHaveBeenCalledWith("onboarding_flags")

    const missing = fakeClient({ data: null, error: { message: "no rows", code: "PGRST116" } })
    expect(await createProfileRepository(missing.client).findOnboardingFlags("u1")).toEqual({})

    const malformed = fakeClient({ data: { onboarding_flags: ["x"] }, error: null })
    expect(await createProfileRepository(malformed.client).findOnboardingFlags("u1")).toEqual({})

    const broken = fakeClient({ data: null, error: { message: "boom" } })
    await expect(createProfileRepository(broken.client).findOnboardingFlags("u1")).rejects.toBeInstanceOf(
      ProfileRepositoryError
    )
  })

  it("writes onboarding flags on the caller's row only", async () => {
    const { client, query } = fakeClient({ data: null, error: null })
    await createProfileRepository(client).setOnboardingFlags("u1", { ob_m1: "x" })
    expect(query.update).toHaveBeenCalledWith({ onboarding_flags: { ob_m1: "x" } })
    expect(query.eq).toHaveBeenCalledWith("id", "u1")
  })

  it("updates mentor fields by user_id", async () => {
    const { client, query } = fakeClient({ data: null, error: null })
    await createProfileRepository(client).updateMentorFields("u1", { is_volunteer: true })
    expect(client.from).toHaveBeenCalledWith("mentor_profiles")
    expect(query.eq).toHaveBeenCalledWith("user_id", "u1")
  })

  it("updates the mentee row and does not insert when it existed", async () => {
    const { client, query } = fakeClient({ data: [{ user_id: "u1" }], error: null })
    await createProfileRepository(client).upsertMenteeFields("u1", { course: "BCC" })
    expect(client.from).toHaveBeenCalledWith("mentee_profiles")
    expect(query.update).toHaveBeenCalledWith({ course: "BCC" })
    expect(query.eq).toHaveBeenCalledWith("user_id", "u1")
    expect(query.insert).not.toHaveBeenCalled()
  })

  it("inserts the mentee row (user_id + fields) when the update touched 0 rows", async () => {
    const { client, query } = fakeClient({ data: [], error: null })
    await createProfileRepository(client).upsertMenteeFields("u1", { course: "BCC" })
    expect(query.update).toHaveBeenCalledWith({ course: "BCC" })
    expect(query.insert).toHaveBeenCalledWith({ user_id: "u1", course: "BCC" })
  })

  it("never upserts the mentee row (PostgREST would rewrite user_id, which has no UPDATE grant)", async () => {
    const { client, query } = fakeClient({ data: [], error: null })
    await createProfileRepository(client).upsertMenteeFields("u1", { course: "BCC" })
    expect(query).not.toHaveProperty("upsert")
  })

  it("reads the cv through profile_cv_url, since cv_url has no select grant", async () => {
    const { client, rpc } = fakeClient({ data: { id: "u1", mentee_profiles: { course: "BCC" } }, error: null })
    const row = await createProfileRepository(client).findOwn("u1")
    expect(PROFILE_SELECT).not.toContain("cv_url")
    expect(rpc).toHaveBeenCalledWith("profile_cv_url", { p_user_id: "u1" })
    expect(row?.mentee_profiles).toEqual({ course: "BCC", cv_url: "u1/cv-1.pdf" })
  })

  it("skips the cv call when the user has no mentee row", async () => {
    const { client, rpc } = fakeClient({ data: { id: "u1", mentee_profiles: null }, error: null })
    await createProfileRepository(client).findOwn("u1")
    expect(rpc).not.toHaveBeenCalled()
  })
})
