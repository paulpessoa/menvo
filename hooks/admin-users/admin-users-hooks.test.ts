import { adminUsersEffects } from "@/lib/query/effects/admin-users"
import { adminUsersKeys } from "@/lib/query/keys/admin-users"
import {
  adminDeleteUserResponseSchema,
  adminUsersResponseSchema,
  adminVerificationsResponseSchema,
  adminVerifyResponseSchema,
} from "@/lib/schemas/admin-users-responses"

describe("admin-users query layer", () => {
  it("every key starts with the admin root", () => {
    expect(adminUsersKeys.all[0]).toBe("admin")
    expect(adminUsersKeys.list({ page: 1 })[0]).toBe("admin")
    expect(adminUsersKeys.verifications("pending")[0]).toBe("admin")
  })

  it("list keys sit under the users root and differ per filter", () => {
    expect(adminUsersKeys.list({ page: 1 }).slice(0, 2)).toEqual(adminUsersKeys.all)
    expect(adminUsersKeys.list({ page: 1 })).not.toEqual(adminUsersKeys.list({ page: 2 }))
    expect(adminUsersKeys.verifications("completed").slice(0, 2)).toEqual(adminUsersKeys.verificationsAll)
  })

  it("every effect is namespaced and returns keys", () => {
    for (const [name, effect] of Object.entries(adminUsersEffects)) {
      expect(name.startsWith("adminUsers.")).toBe(true)
      expect(effect().length).toBeGreaterThan(0)
    }
  })

  it("deciding a verification invalidates queues, users and the public mentors catalog", () => {
    expect(adminUsersEffects["adminUsers.verification.decide"]()).toEqual([
      adminUsersKeys.verificationsAll,
      adminUsersKeys.all,
      ["mentors"],
    ])
  })
})

describe("admin-users response schemas", () => {
  it("accepts the shapes the routes return", () => {
    const user = { id: "u1" }
    expect(
      adminUsersResponseSchema.safeParse({
        data: {
          users: [user],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          counts: { all: 1, pending: 0, mentors: 0, mentees: 1, menvoOrigin: 1, jotformOrigin: 0 },
        },
      }).success
    ).toBe(true)
    expect(adminVerificationsResponseSchema.safeParse({ verifications: [user] }).success).toBe(true)
    expect(adminVerifyResponseSchema.safeParse({ success: true, chatSent: true, emailSent: false }).success).toBe(true)
    expect(adminDeleteUserResponseSchema.safeParse({ success: true, message: "ok", filesRemoved: 1 }).success).toBe(true)
  })

  it("rejects an item without id", () => {
    expect(adminVerificationsResponseSchema.safeParse({ verifications: [{}] }).success).toBe(false)
  })
})
