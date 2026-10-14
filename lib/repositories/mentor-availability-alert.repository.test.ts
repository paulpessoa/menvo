import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createMentorAvailabilityAlertRepository } from "./mentor-availability-alert.repository"
import { RepositoryError } from "./repository-error"

function fakeClient(result: { data: unknown; error: { message: string; code?: string } | null }) {
  const query = {
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(result),
    maybeSingle: jest.fn().mockResolvedValue(result),
    then: (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve),
  }
  const client = {
    from: jest.fn(() => query),
  }
  return { client: client as unknown as SupabaseClient<Database>, query, raw: client }
}

describe("mentor availability alert repository", () => {
  it("subscribes a user to availability alerts", async () => {
    const mockRow = {
      id: "a1",
      mentor_id: "m1",
      mentee_id: "u1",
      email: "user@example.com",
      created_at: "",
      notified_at: null,
    }
    const { client, raw, query } = fakeClient({ data: mockRow, error: null })

    const res = await createMentorAvailabilityAlertRepository(client).subscribe({
      mentor_id: "m1",
      mentee_id: "u1",
      email: "User@example.com ",
    })

    expect(res).toEqual(mockRow)
    expect(raw.from).toHaveBeenCalledWith("mentor_availability_alerts")
    expect(query.insert).toHaveBeenCalledWith({
      mentor_id: "m1",
      mentee_id: "u1",
      email: "user@example.com",
    })
  })

  it("checks if a mentee has an active alert", async () => {
    const { client, raw, query } = fakeClient({ data: { id: "a1" }, error: null })

    const has = await createMentorAvailabilityAlertRepository(client).hasActiveAlert("m1", "u1")
    expect(has).toBe(true)
    expect(raw.from).toHaveBeenCalledWith("mentor_availability_alerts")
    expect(query.eq).toHaveBeenCalledWith("mentor_id", "m1")
    expect(query.eq).toHaveBeenCalledWith("mentee_id", "u1")
    expect(query.is).toHaveBeenCalledWith("notified_at", null)
  })

  it("marks alerts as notified", async () => {
    const { client, raw, query } = fakeClient({ data: null, error: null })

    await createMentorAvailabilityAlertRepository(client).markNotified(["a1", "a2"])
    expect(raw.from).toHaveBeenCalledWith("mentor_availability_alerts")
    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ notified_at: expect.any(String) }))
    expect(query.in).toHaveBeenCalledWith("id", ["a1", "a2"])
  })

  it("wraps driver errors in RepositoryError", async () => {
    const { client } = fakeClient({ data: null, error: { message: "database error" } })
    await expect(
      createMentorAvailabilityAlertRepository(client).subscribe({
        mentor_id: "m1",
        email: "test@example.com",
      })
    ).rejects.toBeInstanceOf(RepositoryError)
  })
})
