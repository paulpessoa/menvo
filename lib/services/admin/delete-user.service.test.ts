/**
 * @jest-environment node
 */
import { deleteUserCompletely } from "./delete-user.service"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { suppress } from "@/lib/services/invites/suppression.service"

jest.mock("@/lib/utils/supabase/service-role", () => ({
  createServiceRoleClient: jest.fn(),
  ensureServerSide: jest.fn()
}))

jest.mock("@/lib/services/invites/suppression.service", () => ({
  hashEmail: jest.fn((email: string) => `hash(${email})`),
  suppress: jest.fn().mockResolvedValue(undefined)
}))

describe("deleteUserCompletely", () => {
  let deleteUserMock: jest.Mock
  let mockSupabase: any
  let tables: Record<string, any>

  function buildProfilesTable(email: string | null) {
    const maybeSingle = jest.fn().mockResolvedValue({ data: email ? { email } : null, error: null })
    const eqSelect = jest.fn().mockReturnValue({ maybeSingle })
    const select = jest.fn().mockReturnValue({ eq: eqSelect })

    const deleteEq = jest.fn().mockResolvedValue({ error: null })
    const del = jest.fn().mockReturnValue({ eq: deleteEq })

    return { select, delete: del, _deleteEq: deleteEq }
  }

  function buildDeletionLogTable() {
    const single = jest.fn().mockResolvedValue({ data: { id: "log-1" }, error: null })
    const select = jest.fn().mockReturnValue({ single })
    const insert = jest.fn().mockReturnValue({ select })

    const updateEq = jest.fn().mockResolvedValue({ data: null, error: null })
    const update = jest.fn().mockReturnValue({ eq: updateEq })

    return { insert, update }
  }

  function buildStorage(filesByBucket: Record<string, { name: string }[]>) {
    return {
      from: jest.fn((bucket: string) => ({
        list: jest.fn().mockResolvedValue({ data: filesByBucket[bucket] ?? [], error: null }),
        remove: jest.fn().mockResolvedValue({ error: null })
      }))
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    deleteUserMock = jest.fn().mockResolvedValue({ error: null })

    tables = {
      profiles: buildProfilesTable("gone@example.com"),
      data_deletion_log: buildDeletionLogTable()
    }

    mockSupabase = {
      from: jest.fn((table: string) => tables[table]),
      storage: buildStorage({ cvs: [{ name: "cv-1.pdf" }], avatars: [] }),
      auth: { admin: { deleteUser: deleteUserMock } }
    }
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  it("deletes the auth user, the profile, logs the request, and suppresses the e-mail", async () => {
    const result = await deleteUserCompletely("user-1", { source: "admin" })

    expect(deleteUserMock).toHaveBeenCalledWith("user-1")
    expect(tables.profiles.delete).toHaveBeenCalled()
    expect(tables.profiles._deleteEq).toHaveBeenCalledWith("id", "user-1")
    expect(tables.data_deletion_log.insert).toHaveBeenCalledWith(
      expect.objectContaining({ email_hash: "hash(gone@example.com)", source: "admin" })
    )
    expect(suppress).toHaveBeenCalledWith("gone@example.com", "deleted")
    expect(result).toEqual({ success: true, filesRemoved: 1 })
  })

  it("still deletes the profile even if auth.admin.deleteUser fails", async () => {
    deleteUserMock.mockResolvedValue({ error: new Error("already gone") })
    const result = await deleteUserCompletely("user-1", { source: "self_service" })
    expect(tables.profiles.delete).toHaveBeenCalled()
    expect(result.success).toBe(true)
  })

  it("skips the deletion log and suppression when the profile has no email on file", async () => {
    tables.profiles = buildProfilesTable(null)
    mockSupabase.from = jest.fn((table: string) => tables[table])

    await deleteUserCompletely("user-1", { source: "admin" })
    expect(tables.data_deletion_log.insert).not.toHaveBeenCalled()
    expect(suppress).not.toHaveBeenCalled()
  })

  it("records the campaign on the deletion log when provided", async () => {
    await deleteUserCompletely("user-1", { source: "invite_token", campaign: "estagiorecife-2026" })
    expect(tables.data_deletion_log.insert).toHaveBeenCalledWith(
      expect.objectContaining({ campaign: "estagiorecife-2026" })
    )
  })
})
