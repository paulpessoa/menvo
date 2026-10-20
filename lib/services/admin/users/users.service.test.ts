/**
 * @jest-environment node
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database, Tables } from "@/lib/types/supabase"
import { adminUsersQuerySchema } from "@/lib/schemas/admin-users"
import { AdminForbiddenError } from "../assert-admin"
import { AdminSelfActionError } from "../self-action.error"
import { adminUserPatchBodySchema } from "@/lib/schemas/admin-users"
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

  const profiles = {
    update: jest.fn(
      async (_id: string, patch: object) => ({ id: UID, email: "ana@x.com", ...patch }) as unknown as Tables<"profiles">
    ),
  }
  const access = {
    upsertMentee: jest.fn(async () => undefined),
    findRoleNames: jest.fn(async () => ["mentee"]),
    replaceRoles: jest.fn(async () => undefined),
  }
  const roles = { findByNames: jest.fn(async (names: readonly string[]) => names.map((name, i) => ({ id: i + 1, name }))) }
  const audit = jest.fn(async () => undefined)

  return {
    session,
    users,
    cv,
    profiles,
    access,
    roles,
    audit,
    service: createAdminUsersService({ session, users, cv, profiles, access, roles, audit }),
  }
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

const ACTOR = "admin-1"
const patch = (raw: object) => adminUserPatchBodySchema.parse(raw)

describe("admin users service · updateUser", () => {
  it.each([[false], ["error" as const]])("refuses a non-admin (%s) before any write or audit", async (state) => {
    const { service, profiles, access, audit } = setup(state)
    await expect(
      service.updateUser({ actorId: ACTOR, targetId: UID, body: patch({ updates: { bio: "x" }, roles: ["mentor"] }) })
    ).rejects.toBeInstanceOf(AdminForbiddenError)
    expect(profiles.update).not.toHaveBeenCalled()
    expect(access.upsertMentee).not.toHaveBeenCalled()
    expect(access.replaceRoles).not.toHaveBeenCalled()
    expect(audit).not.toHaveBeenCalled()
  })

  it("blocks an admin from dropping their own admin role, with no write", async () => {
    const { service, profiles, access } = setup()
    await expect(
      service.updateUser({ actorId: ACTOR, targetId: ACTOR, body: patch({ roles: ["mentor"] }) })
    ).rejects.toBeInstanceOf(AdminSelfActionError)
    expect(profiles.update).not.toHaveBeenCalled()
    expect(access.replaceRoles).not.toHaveBeenCalled()
  })

  it("lets an admin edit themselves while keeping the admin role", async () => {
    const { service, access } = setup()
    access.findRoleNames.mockResolvedValueOnce(["admin"])
    await service.updateUser({ actorId: ACTOR, targetId: ACTOR, body: patch({ roles: ["admin", "mentor"] }) })
    expect(access.replaceRoles).toHaveBeenCalledWith(ACTOR, [1, 2])
  })

  it("splits mentee fields from profile fields and audits the update", async () => {
    const { service, profiles, access, audit } = setup()
    const result = await service.updateUser({
      actorId: ACTOR,
      targetId: UID,
      body: patch({ updates: { first_name: "Ana", institution: "UFPE" } }),
    })

    expect(access.upsertMentee).toHaveBeenCalledWith(UID, { institution: "UFPE" })
    expect(profiles.update).toHaveBeenCalledWith(UID, expect.objectContaining({ first_name: "Ana", updated_at: expect.any(String) }))
    expect(profiles.update.mock.calls[0][1]).not.toHaveProperty("institution")
    expect(result).toMatchObject({ id: UID, first_name: "Ana" })
    expect(audit).toHaveBeenCalledTimes(1)
    expect(audit).toHaveBeenCalledWith(ACTOR, "user_updated", { fields: ["first_name", "institution"] }, UID, "ana@x.com", undefined)
  })

  it("skips the mentee write when no academic field changed", async () => {
    const { service, access } = setup()
    await service.updateUser({ actorId: ACTOR, targetId: UID, body: patch({ updates: { bio: "oi" } }) })
    expect(access.upsertMentee).not.toHaveBeenCalled()
  })

  it("replaces roles only when the set changed, and audits the change", async () => {
    const { service, access, audit } = setup()
    await service.updateUser({ actorId: ACTOR, targetId: UID, body: patch({ roles: ["mentee"] }) })
    expect(access.replaceRoles).not.toHaveBeenCalled()

    await service.updateUser({ actorId: ACTOR, targetId: UID, body: patch({ roles: ["mentor", "mentee"] }) })
    expect(access.replaceRoles).toHaveBeenCalledWith(UID, [1, 2])
    expect(audit).toHaveBeenCalledWith(ACTOR, "user_role_changed", { from: ["mentee"], to: ["mentor", "mentee"] }, UID, "ana@x.com", undefined)
  })

  it("does not audit when the profile write fails", async () => {
    const { service, profiles, audit } = setup()
    profiles.update.mockRejectedValueOnce(new Error("boom"))
    await expect(service.updateUser({ actorId: ACTOR, targetId: UID, body: patch({}) })).rejects.toThrow("boom")
    expect(audit).not.toHaveBeenCalled()
  })
})
