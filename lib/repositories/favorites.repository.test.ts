import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createFavoritesRepository } from "./favorites.repository"
import { RepositoryError } from "./repository-error"

function fakeClient(result: { data: unknown; error: { message: string } | null }) {
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    insert: jest.fn(async () => result),
    then: (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve),
  }
  const client = { from: jest.fn(() => query) }
  return { client: client as unknown as SupabaseClient<Database>, query }
}

describe("favorites repository", () => {
  it("lists only the caller's favorites as mentor ids", async () => {
    const { client, query } = fakeClient({ data: [{ mentor_id: "m1" }, { mentor_id: "m2" }], error: null })
    expect(await createFavoritesRepository(client).listMentorIds("u1")).toEqual(["m1", "m2"])
    expect(client.from).toHaveBeenCalledWith("user_favorites")
    expect(query.eq).toHaveBeenCalledWith("user_id", "u1")
  })

  it("treats a null result as no favorites", async () => {
    const { client } = fakeClient({ data: null, error: null })
    expect(await createFavoritesRepository(client).listMentorIds("u1")).toEqual([])
  })

  it("inserts with the user id passed by the service", async () => {
    const { client, query } = fakeClient({ data: null, error: null })
    await createFavoritesRepository(client).add("u1", "m1")
    expect(query.insert).toHaveBeenCalledWith({ user_id: "u1", mentor_id: "m1" })
  })

  it("deletes scoped by user and mentor", async () => {
    const { client, query } = fakeClient({ data: null, error: null })
    await createFavoritesRepository(client).remove("u1", "m1")
    expect(query.eq).toHaveBeenCalledWith("user_id", "u1")
    expect(query.eq).toHaveBeenCalledWith("mentor_id", "m1")
  })

  it("wraps driver errors in RepositoryError", async () => {
    const { client } = fakeClient({ data: null, error: { message: "boom" } })
    await expect(createFavoritesRepository(client).listMentorIds("u1")).rejects.toBeInstanceOf(RepositoryError)
    await expect(createFavoritesRepository(client).add("u1", "m1")).rejects.toBeInstanceOf(RepositoryError)
    await expect(createFavoritesRepository(client).remove("u1", "m1")).rejects.toBeInstanceOf(RepositoryError)
  })
})
