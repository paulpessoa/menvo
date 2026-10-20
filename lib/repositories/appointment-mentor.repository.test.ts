/**
 * @jest-environment node
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createAppointmentMentorRepository } from "./appointment-mentor.repository"
import { RepositoryError } from "./repository-error"

function clientReturning(result: unknown) {
  const single = jest.fn().mockResolvedValue(result)
  const eq = jest.fn().mockReturnValue({ single })
  const select = jest.fn().mockReturnValue({ eq })
  const from = jest.fn().mockReturnValue({ select })
  return { db: { from } as unknown as SupabaseClient<Database>, from, eq }
}

describe("appointmentMentor.findRequestable", () => {
  it("flattens the verification status into `verified`", async () => {
    const { db, from, eq } = clientReturning({
      data: { id: "m1", full_name: "Marta", email: "m@x.com", mentor_profiles: { verification_status: "approved" } },
      error: null,
    })
    expect(await createAppointmentMentorRepository(db).findRequestable("m1")).toEqual({
      id: "m1",
      full_name: "Marta",
      email: "m@x.com",
      verified: true,
    })
    expect(from).toHaveBeenCalledWith("profiles")
    expect(eq).toHaveBeenCalledWith("id", "m1")
  })

  it("is not verified without a mentor_profiles row or while pending", async () => {
    const pending = clientReturning({ data: { id: "m1", mentor_profiles: { verification_status: "pending" } }, error: null })
    const none = clientReturning({ data: { id: "m1", mentor_profiles: null }, error: null })
    expect((await createAppointmentMentorRepository(pending.db).findRequestable("m1"))?.verified).toBe(false)
    expect((await createAppointmentMentorRepository(none.db).findRequestable("m1"))?.verified).toBe(false)
  })

  it.each([
    ["no row", { code: "PGRST116", message: "0 rows" }],
    ["a malformed uuid", { code: "22P02", message: "invalid input" }],
    ["an error without a code", { message: "Not found" }],
  ])("returns null for %s", async (_label, error) => {
    const { db } = clientReturning({ data: null, error })
    expect(await createAppointmentMentorRepository(db).findRequestable("x")).toBeNull()
  })

  it("lets a technical error surface", async () => {
    const { db } = clientReturning({ data: null, error: { code: "42501", message: "permission denied" } })
    await expect(createAppointmentMentorRepository(db).findRequestable("m1")).rejects.toBeInstanceOf(RepositoryError)
  })
})
