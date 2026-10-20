import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createAdminMentorApplicationsReader, createAdminMentorsReader } from "./admin-mentor-verification.repository"
import { RepositoryError } from "./repository-error"

type Result = { data?: unknown; error?: { message: string } | null }

function fakeClient(result: Result) {
  const query = {
    select: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then: (resolve: (v: unknown) => unknown) => Promise.resolve({ error: null, ...result }).then(resolve),
  }
  const client = { from: jest.fn(() => query) }
  return { client: client as unknown as SupabaseClient<Database>, query }
}

describe("admin mentor applications reader", () => {
  it("reads mentor_profiles by status, newest update first, with the limit", async () => {
    const { client, query } = fakeClient({ data: [{ user_id: "u1" }] })
    const rows = await createAdminMentorApplicationsReader(client).listByStatus(["pending", "changes_requested"], 50)

    expect(client.from).toHaveBeenCalledWith("mentor_profiles")
    expect(query.select.mock.calls[0][0]).toContain("profiles!inner(")
    expect(query.in).toHaveBeenCalledWith("verification_status", ["pending", "changes_requested"])
    expect(query.order).toHaveBeenCalledWith("updated_at", { ascending: false })
    expect(query.limit).toHaveBeenCalledWith(50)
    expect(rows).toEqual([{ user_id: "u1" }])
  })

  it("wraps driver errors in RepositoryError", async () => {
    const { client } = fakeClient({ data: null, error: { message: "boom" } })
    await expect(createAdminMentorApplicationsReader(client).listByStatus(["pending"], 10)).rejects.toBeInstanceOf(
      RepositoryError
    )
  })
})

describe("admin mentors reader", () => {
  it("lists mentors_view newest first", async () => {
    const { client, query } = fakeClient({ data: [{ id: "m1" }] })
    expect(await createAdminMentorsReader(client).listMentors()).toEqual([{ id: "m1" }])
    expect(client.from).toHaveBeenCalledWith("mentors_view")
    expect(query.order).toHaveBeenCalledWith("created_at", { ascending: false })
  })

  it("skips the e-mail query when there are no ids", async () => {
    const { client } = fakeClient({ data: [] })
    expect(await createAdminMentorsReader(client).findEmails([])).toEqual([])
    expect(client.from).not.toHaveBeenCalled()
  })

  it("reads e-mails from profiles in one query", async () => {
    const { client, query } = fakeClient({ data: [{ id: "m1", email: "a@x.com" }] })
    expect(await createAdminMentorsReader(client).findEmails(["m1"])).toEqual([{ id: "m1", email: "a@x.com" }])
    expect(client.from).toHaveBeenCalledWith("profiles")
    expect(query.in).toHaveBeenCalledWith("id", ["m1"])
  })

  it("wraps driver errors in RepositoryError", async () => {
    const { client } = fakeClient({ data: null, error: { message: "boom" } })
    await expect(createAdminMentorsReader(client).listMentors()).rejects.toBeInstanceOf(RepositoryError)
  })
})
