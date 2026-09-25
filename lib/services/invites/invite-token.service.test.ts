/**
 * @jest-environment node
 */
import { createInviteToken, resolveInviteToken, markOpened, markResponse } from "./invite-token.service"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"

jest.mock("@/lib/utils/supabase/service-role", () => ({
  createServiceRoleClient: jest.fn(),
  ensureServerSide: jest.fn()
}))

describe("createInviteToken", () => {
  it("returns a plaintext token that is never sent to the database", async () => {
    const single = jest.fn().mockResolvedValue({ data: { id: "invite-1" }, error: null })
    const select = jest.fn().mockReturnValue({ single })
    const upsert = jest.fn().mockReturnValue({ select })
    const mockSupabase = { from: jest.fn().mockReturnValue({ upsert }) }
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockSupabase)

    const { token, inviteId } = await createInviteToken({
      userId: "user-1",
      campaign: "estagiorecife-2026",
      subject: "Oi",
      sentBy: "admin-1"
    })

    expect(inviteId).toBe("invite-1")
    expect(token.length).toBeGreaterThan(20)

    const written = upsert.mock.calls[0][0]
    expect(written.token_hash).not.toBe(token)
    expect(JSON.stringify(written)).not.toContain(token)
  })

  it("clears prior response/opened_at only when resend is requested", async () => {
    const single = jest.fn().mockResolvedValue({ data: { id: "invite-1" }, error: null })
    const select = jest.fn().mockReturnValue({ single })
    const upsert = jest.fn().mockReturnValue({ select })
    const mockSupabase = { from: jest.fn().mockReturnValue({ upsert }) }
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockSupabase)

    await createInviteToken({ userId: "u1", campaign: "c1", subject: "s", sentBy: "a1" })
    expect(upsert.mock.calls[0][0]).not.toHaveProperty("response")

    await createInviteToken({ userId: "u1", campaign: "c1", subject: "s", sentBy: "a1", resend: true })
    expect(upsert.mock.calls[1][0]).toMatchObject({ response: null, opened_at: null, responded_at: null })
  })
})

describe("resolveInviteToken", () => {
  function mockChain(inviteResult: any, profileResult?: any) {
    const inviteMaybeSingle = jest.fn().mockResolvedValue(inviteResult)
    const inviteEq = jest.fn().mockReturnValue({ maybeSingle: inviteMaybeSingle })
    const inviteSelect = jest.fn().mockReturnValue({ eq: inviteEq })

    const profileMaybeSingle = jest.fn().mockResolvedValue(profileResult ?? { data: null, error: null })
    const profileEq = jest.fn().mockReturnValue({ maybeSingle: profileMaybeSingle })
    const profileSelect = jest.fn().mockReturnValue({ eq: profileEq })

    const mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === "reengagement_invites") return { select: inviteSelect }
        if (table === "profiles") return { select: profileSelect }
        throw new Error(`unexpected table ${table}`)
      })
    }
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockSupabase)
    return mockSupabase
  }

  it("rejects a token that is too short without querying the database", async () => {
    const mockSupabase = mockChain({ data: null, error: null })
    const result = await resolveInviteToken("short")
    expect(result).toEqual({ ok: false, reason: "invalid" })
    expect(mockSupabase.from).not.toHaveBeenCalled()
  })

  it("returns invalid when no invite matches the token hash", async () => {
    mockChain({ data: null, error: null })
    const result = await resolveInviteToken("a".repeat(43))
    expect(result).toEqual({ ok: false, reason: "invalid" })
  })

  it("returns expired for a past expires_at", async () => {
    mockChain({
      data: { id: "invite-1", expires_at: new Date(Date.now() - 1000).toISOString(), user_id: "u1" },
      error: null
    })
    const result = await resolveInviteToken("a".repeat(43))
    expect(result).toEqual({ ok: false, reason: "expired" })
  })

  it("returns the invite and profile for a valid, unexpired token", async () => {
    const invite = { id: "invite-1", expires_at: new Date(Date.now() + 100000).toISOString(), user_id: "u1" }
    const profile = { id: "u1", email: "x@example.com", full_name: "X" }
    mockChain({ data: invite, error: null }, { data: profile, error: null })
    const result = await resolveInviteToken("a".repeat(43))
    expect(result).toEqual({ ok: true, invite, profile })
  })
})

describe("markOpened", () => {
  it("sets opened_at only if it was not already set", async () => {
    const selectMaybeSingle = jest.fn().mockResolvedValue({ data: { opened_at: null } })
    const selectEq = jest.fn().mockReturnValue({ maybeSingle: selectMaybeSingle })
    const select = jest.fn().mockReturnValue({ eq: selectEq })
    const updateEq = jest.fn().mockResolvedValue({ data: null, error: null })
    const update = jest.fn().mockReturnValue({ eq: updateEq })
    const mockSupabase = { from: jest.fn().mockReturnValue({ select, update }) }
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockSupabase)

    await markOpened("invite-1")
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ opened_at: expect.any(String) }))
  })

  it("does nothing when opened_at is already set", async () => {
    const selectMaybeSingle = jest.fn().mockResolvedValue({ data: { opened_at: "2026-01-01T00:00:00Z" } })
    const selectEq = jest.fn().mockReturnValue({ maybeSingle: selectMaybeSingle })
    const select = jest.fn().mockReturnValue({ eq: selectEq })
    const update = jest.fn()
    const mockSupabase = { from: jest.fn().mockReturnValue({ select, update }) }
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockSupabase)

    await markOpened("invite-1")
    expect(update).not.toHaveBeenCalled()
  })
})

describe("markResponse", () => {
  it("returns true and writes the response when no prior response exists", async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: { id: "invite-1" }, error: null })
    const select = jest.fn().mockReturnValue({ maybeSingle })
    const is = jest.fn().mockReturnValue({ select })
    const eq = jest.fn().mockReturnValue({ is })
    const update = jest.fn().mockReturnValue({ eq })
    const mockSupabase = { from: jest.fn().mockReturnValue({ update }) }
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockSupabase)

    const result = await markResponse("invite-1", "deleted")
    expect(result).toBe(true)
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ response: "deleted" }))
  })

  it("returns false when the invite was already responded to (no double-delete)", async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null })
    const select = jest.fn().mockReturnValue({ maybeSingle })
    const is = jest.fn().mockReturnValue({ select })
    const eq = jest.fn().mockReturnValue({ is })
    const update = jest.fn().mockReturnValue({ eq })
    const mockSupabase = { from: jest.fn().mockReturnValue({ update }) }
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockSupabase)

    const result = await markResponse("invite-1", "deleted")
    expect(result).toBe(false)
  })
})
