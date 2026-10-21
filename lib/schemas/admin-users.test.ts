import {
  adminUserPatchBodySchema,
  adminUsersQuerySchema,
  adminVerifyBodySchema,
} from "./admin-users"

const UUID = "123e4567-e89b-42d3-a456-426614174000"

describe("adminUsersQuerySchema", () => {
  it("falls back to the route's old defaults on an empty query", () => {
    expect(adminUsersQuerySchema.parse({})).toEqual({
      page: 1,
      limit: 10,
      search: "",
      origin: undefined,
      role: undefined,
      status: undefined,
      sort_by: "created_at",
      sort_order: "desc",
    })
  })

  it("caps limit at 100 instead of passing it to .range", () => {
    expect(adminUsersQuerySchema.parse({ limit: "5000" }).limit).toBe(100)
    expect(adminUsersQuerySchema.parse({ limit: "30" }).limit).toBe(30)
  })

  it("ignores garbage instead of rejecting (response format does not change)", () => {
    const q = adminUsersQuerySchema.parse({
      page: "abc",
      limit: "-3",
      role: "admin",
      status: "x",
      sort_order: "sideways",
    })
    expect(q).toMatchObject({ page: 1, limit: 10, role: undefined, status: undefined, sort_order: "desc" })
  })
})

describe("adminUserPatchBodySchema", () => {
  it("no longer accepts the moderator role", () => {
    expect(adminUserPatchBodySchema.safeParse({ roles: ["moderator"] }).success).toBe(false)
    expect(adminUserPatchBodySchema.safeParse({ roles: ["mentor", "admin"] }).success).toBe(true)
  })

  it("strips verification columns", () => {
    const parsed = adminUserPatchBodySchema.parse({
      updates: { first_name: "Ana", verified: true },
    })
    expect(parsed.updates).toEqual({ first_name: "Ana" })
  })
})

describe("adminVerifyBodySchema", () => {
  it("requires a UUID userId", () => {
    expect(adminVerifyBodySchema.safeParse({ userId: "abc", status: "approved" }).success).toBe(false)
    expect(adminVerifyBodySchema.safeParse({ userId: UUID, status: "approved" }).success).toBe(true)
  })
})
