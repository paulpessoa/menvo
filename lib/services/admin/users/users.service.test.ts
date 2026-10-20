/**
 * @jest-environment node
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { adminUsersQuerySchema } from "@/lib/schemas/admin-users"
import { AdminForbiddenError } from "../assert-admin"
import { createAdminUsersService } from "./users.service"

const UID = "123e4567-e89b-42d3-a456-426614174000"
const query = adminUsersQuerySchema.parse({ page: "2", limit: "10" })

function setup(isAdmin: boolean | "error" = true) {
  const session = {
    rpc: jest.fn(async () =>
      isAdmin === "error" ? { data: null, error: { message: "rpc down" } } : { data: isAdmin, error: null }
    ),
  } as unknown as SupabaseClient<Database>

  const users = {
    list: jest.fn(async () => ({
      rows: [
        {
          id: UID,
          full_name: "Ana",
          mentor_profiles: { verification_status: "approved" },
          mentee_profiles: null,
          user_roles: [{ roles: { name: "mentor" } }],
          import_records: { origin_platform: "jotform", invite_sent_at: "2026-01-01" },
        },
        { id: "u2", full_name: "Bia", import_records: null },
      ],
      total: 25,
    })),
    counts: jest.fn(async () => ({ all: 25, pending: 1, mentors: 3, mentees: 20, menvoOrigin: 5, jotformOrigin: 20 })),
  }
  const cv = { findStoredCvUrls: jest.fn(async () => [{ user_id: UID, cv_url: `${UID}/cv-1.pdf` }]) }

  return { session, users, cv, service: createAdminUsersService({ session, users, cv }) }
}

describe("admin users service", () => {
  it.each([[false], ["error" as const]])("refuses a non-admin (%s) before touching any repository", async (state) => {
    const { service, users, cv } = setup(state)
    await expect(service.listUsers(query)).rejects.toBeInstanceOf(AdminForbiddenError)
    expect(users.list).not.toHaveBeenCalled()
    expect(users.counts).not.toHaveBeenCalled()
    expect(cv.findStoredCvUrls).not.toHaveBeenCalled()
  })

  it("flattens mentor fields, origin and the cv link, and computes pagination", async () => {
    const { service, cv } = setup()
    const result = await service.listUsers(query)

    expect(cv.findStoredCvUrls).toHaveBeenCalledWith([UID, "u2"])
    expect(result.pagination).toEqual({ page: 2, limit: 10, total: 25, totalPages: 3 })
    expect(result.counts.all).toBe(25)

    const [ana, bia] = result.users
    expect(ana).toMatchObject({
      id: UID,
      verified: true,
      verification_status: "approved",
      cv_url: `/api/cv/${UID}`,
      origin_platform: "jotform",
      invite_sent_at: "2026-01-01",
    })
    expect(ana).not.toHaveProperty("mentor_profiles")
    expect(ana).not.toHaveProperty("import_records")
    expect(bia).toMatchObject({ cv_url: null, origin_platform: "menvo", invite_sent_at: null, verified: false })
  })

  it("drops a stored cv that does not belong to the user", async () => {
    const { service, cv } = setup()
    cv.findStoredCvUrls.mockResolvedValueOnce([{ user_id: UID, cv_url: "someone-else/cv-1.pdf" }])
    const result = await service.listUsers(query)
    expect(result.users[0].cv_url).toBeNull()
  })
})
