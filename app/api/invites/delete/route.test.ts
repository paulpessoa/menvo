/**
 * @jest-environment node
 */
import { POST } from "./route"
import { NextRequest } from "next/server"
import { resolveInviteToken, markResponse } from "@/lib/services/invites/invite-token.service"
import { deleteUserCompletely } from "@/lib/services/admin/delete-user.service"

jest.mock("@/lib/services/invites/invite-token.service", () => ({
  resolveInviteToken: jest.fn(),
  markResponse: jest.fn()
}))
jest.mock("@/lib/services/admin/delete-user.service", () => ({ deleteUserCompletely: jest.fn() }))

const profile = { id: "u1", email: "u1@example.com", full_name: "U1" }
const invite = { id: "invite-1", campaign: "estagiorecife-2026" }

function makeRequest(body: any) {
  return new NextRequest("http://localhost:3000/api/invites/delete", {
    method: "POST",
    headers: { "x-forwarded-for": "1.2.3.4" },
    body: JSON.stringify(body)
  })
}

describe("POST /api/invites/delete", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(resolveInviteToken as jest.Mock).mockResolvedValue({ ok: true, invite, profile })
    ;(markResponse as jest.Mock).mockResolvedValue(true)
    ;(deleteUserCompletely as jest.Mock).mockResolvedValue({ success: true, filesRemoved: 0 })
  })

  it("requires confirm: true", async () => {
    const res = await POST(makeRequest({ token: "a".repeat(40), confirm: false }))
    expect(res.status).toBe(400)
    expect(deleteUserCompletely).not.toHaveBeenCalled()
  })

  it("rejects an invalid/expired token without deleting anything", async () => {
    ;(resolveInviteToken as jest.Mock).mockResolvedValue({ ok: false, reason: "invalid" })
    const res = await POST(makeRequest({ token: "a".repeat(40), confirm: true }))
    expect(res.status).toBe(400)
    expect(deleteUserCompletely).not.toHaveBeenCalled()
  })

  it("refuses a second delete attempt on an already-responded invite (no double-delete)", async () => {
    ;(markResponse as jest.Mock).mockResolvedValue(false)
    const res = await POST(makeRequest({ token: "a".repeat(40), confirm: true }))
    expect(res.status).toBe(409)
    expect(deleteUserCompletely).not.toHaveBeenCalled()
  })

  it("deletes the user behind the token, tagging the source and campaign", async () => {
    const res = await POST(makeRequest({ token: "a".repeat(40), confirm: true }))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(deleteUserCompletely).toHaveBeenCalledWith("u1", { source: "invite_token", campaign: "estagiorecife-2026" })
  })
})
