/**
 * @jest-environment node
 */
import { POST } from "./route"
import { NextRequest } from "next/server"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { resolveInviteToken, markResponse } from "@/lib/services/invites/invite-token.service"
import { suppress } from "@/lib/services/invites/suppression.service"

jest.mock("@/lib/utils/supabase/service-role", () => ({ createServiceRoleClient: jest.fn() }))
jest.mock("@/lib/services/invites/invite-token.service", () => ({
  resolveInviteToken: jest.fn(),
  markResponse: jest.fn()
}))
jest.mock("@/lib/services/invites/suppression.service", () => ({ suppress: jest.fn().mockResolvedValue(undefined) }))

const profile = { id: "u1", email: "u1@example.com", full_name: "U1" }
const invite = { id: "invite-1", campaign: "c1" }

function makeRequest(body: any) {
  return new NextRequest("http://localhost:3000/api/invites/respond", {
    method: "POST",
    headers: { "x-forwarded-for": "1.2.3.4" },
    body: JSON.stringify(body)
  })
}

describe("POST /api/invites/respond", () => {
  let mockSupabase: any
  let generateLink: jest.Mock
  let updateEq: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    generateLink = jest.fn().mockResolvedValue({
      data: { properties: { action_link: "https://x.supabase.co/verify?type=recovery" } },
      error: null
    })
    updateEq = jest.fn().mockResolvedValue({ error: null })
    mockSupabase = {
      from: jest.fn().mockReturnValue({ update: jest.fn().mockReturnValue({ eq: updateEq }) }),
      auth: { admin: { generateLink } }
    }
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockSupabase)
    ;(resolveInviteToken as jest.Mock).mockResolvedValue({ ok: true, invite, profile })
    ;(markResponse as jest.Mock).mockResolvedValue(true)
  })

  it("rejects a malformed body", async () => {
    const res = await POST(makeRequest({ token: "short", action: "nope" }))
    expect(res.status).toBe(400)
  })

  it("returns the resolve failure reason for an invalid token", async () => {
    ;(resolveInviteToken as jest.Mock).mockResolvedValue({ ok: false, reason: "expired" })
    const res = await POST(makeRequest({ token: "a".repeat(40), action: "accept" }))
    const json = await res.json()
    expect(res.status).toBe(400)
    expect(json.error).toBe("expired")
  })

  it("returns 409 without acting again when the invite already has a response", async () => {
    ;(markResponse as jest.Mock).mockResolvedValue(false)
    const res = await POST(makeRequest({ token: "a".repeat(40), action: "accept" }))
    expect(res.status).toBe(409)
    expect(generateLink).not.toHaveBeenCalled()
  })

  it("opt_out sets email_opt_out_at and suppresses the e-mail, without generating a login link", async () => {
    const res = await POST(makeRequest({ token: "a".repeat(40), action: "opt_out" }))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(suppress).toHaveBeenCalledWith("u1@example.com", "opted_out")
    expect(updateEq).toHaveBeenCalledWith("id", "u1")
    expect(generateLink).not.toHaveBeenCalled()
  })

  it("accept generates a recovery link and returns it as redirectUrl", async () => {
    const res = await POST(makeRequest({ token: "a".repeat(40), action: "accept" }))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.redirectUrl).toContain("type=recovery")
    expect(markResponse).toHaveBeenCalledWith("invite-1", "accepted")
  })

  it("accept_mentor records a distinct response but the same login flow", async () => {
    await POST(makeRequest({ token: "a".repeat(40), action: "accept_mentor" }))
    expect(markResponse).toHaveBeenCalledWith("invite-1", "accepted_mentor")
    expect(generateLink).toHaveBeenCalled()
  })
})
