import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createMeNotificationsRepository } from "./me-notifications.repository"
import { RepositoryError } from "./repository-error"

function fakeClient(result: { data: unknown; error: { message: string } | null }) {
  const query = {
    select: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    limit: jest.fn(async () => result),
    then: (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve),
  }
  const client = { from: jest.fn(() => query) }
  return { client: client as unknown as SupabaseClient<Database>, query }
}

describe("me notifications repository", () => {
  it("reads the 20 most recently changed appointments of the user, newest first", async () => {
    const { client, query } = fakeClient({ data: [{ id: "a1" }], error: null })
    const rows = await createMeNotificationsRepository(client).listRecentAppointments("u1")
    expect(client.from).toHaveBeenCalledWith("appointments")
    expect(query.or).toHaveBeenCalledWith("mentor_id.eq.u1,mentee_id.eq.u1")
    expect(query.order).toHaveBeenCalledWith("updated_at", { ascending: false })
    expect(query.limit).toHaveBeenCalledWith(20)
    expect(rows).toEqual([{ id: "a1" }])
  })

  it("embeds only the name of the other person, never contact data", async () => {
    const { client, query } = fakeClient({ data: [], error: null })
    await createMeNotificationsRepository(client).listRecentAppointments("u1")
    const columns = query.select.mock.calls[0][0] as string
    expect(columns).toContain("profiles!mentor_id(full_name)")
    expect(columns).not.toMatch(/email|phone|avatar/)
  })

  it("lists the appointment ids the user already reviewed", async () => {
    const { client, query } = fakeClient({ data: [{ appointment_id: "a1" }, { appointment_id: "a2" }], error: null })
    expect(await createMeNotificationsRepository(client).listReviewedAppointmentIds("u1")).toEqual(["a1", "a2"])
    expect(query.eq).toHaveBeenCalledWith("reviewer_id", "u1")
  })

  it("wraps driver errors in RepositoryError", async () => {
    const { client } = fakeClient({ data: null, error: { message: "boom" } })
    await expect(createMeNotificationsRepository(client).listRecentAppointments("u1")).rejects.toBeInstanceOf(
      RepositoryError
    )
    await expect(createMeNotificationsRepository(client).listReviewedAppointmentIds("u1")).rejects.toBeInstanceOf(
      RepositoryError
    )
  })
})
