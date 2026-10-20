import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createMentorRequestRepository } from "./mentor-request.repository"
import { ProfileRepositoryError } from "./profile.repository"

function fakeClient(result: { data: unknown; error: { message: string } | null }) {
  const query = {
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn(async () => result),
  }
  const client = { from: jest.fn(() => query), rpc: jest.fn(async () => result) }
  return { client: client as unknown as SupabaseClient<Database>, query, rpc: client.rpc }
}

describe("mentor request repository", () => {
  it("asks for verification only through the RPC (status has no direct grant)", async () => {
    const { client, rpc } = fakeClient({ data: null, error: null })
    await createMentorRequestRepository(client).requestVerification()
    expect(rpc).toHaveBeenCalledWith("request_mentor_verification")
  })

  it("saves the texts on the caller's mentor_profiles row and returns the status", async () => {
    const { client, query } = fakeClient({ data: { user_id: "u1", verification_status: "pending" }, error: null })
    const row = await createMentorRequestRepository(client).saveApproach("u1", {
      mentorship_approach: "a",
      what_to_expect: null,
    })
    expect(client.from).toHaveBeenCalledWith("mentor_profiles")
    expect(query.update).toHaveBeenCalledWith({ mentorship_approach: "a", what_to_expect: null })
    expect(query.eq).toHaveBeenCalledWith("user_id", "u1")
    expect(row).toEqual({ user_id: "u1", verification_status: "pending" })
  })

  it("keeps the raw driver error on failure", async () => {
    const raw = { message: "denied" }
    const { client } = fakeClient({ data: null, error: raw })
    const error = await createMentorRequestRepository(client).requestVerification().catch(e => e)
    expect(error).toBeInstanceOf(ProfileRepositoryError)
    expect(error.dbError).toBe(raw)
  })
})
