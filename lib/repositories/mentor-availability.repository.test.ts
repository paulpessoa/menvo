import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createMentorAvailabilityRepository } from "./mentor-availability.repository"
import { RepositoryError } from "./repository-error"

function fakeClient(result: { data: unknown; error: { message: string } | null }) {
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    then: (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve),
  }
  const client = {
    from: jest.fn(() => query),
    rpc: jest.fn(async () => result),
  }
  return { client: client as unknown as SupabaseClient<Database>, query, raw: client }
}

describe("mentor availability repository", () => {
  it("lists a mentor's slots ordered by day and start time", async () => {
    const { client, query, raw } = fakeClient({ data: [{ id: "s1" }], error: null })
    const rows = await createMentorAvailabilityRepository(client).listByMentor("m1")
    expect(rows).toEqual([{ id: "s1" }])
    expect(raw.from).toHaveBeenCalledWith("mentor_availability")
    expect(query.eq).toHaveBeenCalledWith("mentor_id", "m1")
    expect(query.order).toHaveBeenNthCalledWith(1, "day_of_week", { ascending: true })
    expect(query.order).toHaveBeenNthCalledWith(2, "start_time", { ascending: true })
  })

  it("wraps driver errors in RepositoryError", async () => {
    const { client } = fakeClient({ data: null, error: { message: "boom" } })
    await expect(createMentorAvailabilityRepository(client).listByMentor("m1")).rejects.toBeInstanceOf(RepositoryError)
  })

  it("replaces the schedule through the transactional RPC", async () => {
    const { client, raw } = fakeClient({ data: [{ id: "n1" }], error: null })
    const slots = [{ day_of_week: 1, start_time: "09:00:00", end_time: "10:00:00", timezone: "America/Sao_Paulo" }]
    const rows = await createMentorAvailabilityRepository(client).replaceOwn(slots, "America/Recife")
    expect(rows).toEqual([{ id: "n1" }])
    expect(raw.rpc).toHaveBeenCalledWith("set_mentor_availability", { p_slots: slots, p_timezone: "America/Recife" })
    expect(raw.from).not.toHaveBeenCalled()
  })

  it("surfaces RPC errors as RepositoryError", async () => {
    const { client } = fakeClient({ data: null, error: { message: "denied" } })
    await expect(createMentorAvailabilityRepository(client).replaceOwn([], null)).rejects.toThrow("mentorAvailability.replaceOwn")
  })
})
