/**
 * @jest-environment node
 */
import { POST } from "./route"
import { NextRequest } from "next/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { createInviteToken } from "@/lib/services/invites/invite-token.service"
import { sendReengagementInvite } from "@/lib/email/brevo"
import { logAdminAction } from "@/lib/audit-logger"

jest.mock("@/lib/auth/require-admin", () => ({ requireAdmin: jest.fn() }))
jest.mock("@/lib/utils/supabase/service-role", () => ({ createServiceRoleClient: jest.fn() }))
jest.mock("@/lib/services/invites/invite-token.service", () => ({ createInviteToken: jest.fn() }))
jest.mock("@/lib/email/brevo", () => ({ sendReengagementInvite: jest.fn() }))
jest.mock("@/lib/audit-logger", () => ({ logAdminAction: jest.fn().mockResolvedValue(undefined) }))

const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>

function makeRequest(body: any) {
  return new NextRequest("http://localhost:3000/api/admin/invites/send", {
    method: "POST",
    body: JSON.stringify(body)
  })
}

describe("POST /api/admin/invites/send", () => {
  let updateEq: jest.Mock
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({ ok: true, admin: { userId: "admin-1", role: "admin" } })
    ;(createInviteToken as jest.Mock).mockResolvedValue({ token: "plaintext-token", inviteId: "invite-1" })
    ;(sendReengagementInvite as jest.Mock).mockResolvedValue({ success: true })

    updateEq = jest.fn().mockResolvedValue({ error: null })
    mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: "u1", email: "u1@example.com", full_name: "U1" }, error: null })
          })
        }),
        update: jest.fn().mockReturnValue({ eq: updateEq })
      })
    }
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  it("rejects a batch larger than 25", async () => {
    const userIds = Array.from({ length: 26 }, (_, i) => `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`)
    const res = await POST(makeRequest({ campaign: "c1", subject: "s", body: "b", userIds }))
    expect(res.status).toBe(400)
  })

  it("sends to every user in the batch and reports per-user success", async () => {
    const res = await POST(makeRequest({
      campaign: "c1",
      subject: "s",
      body: "b",
      userIds: ["00000000-0000-0000-0000-000000000001"]
    }))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.success).toBe(1)
    expect(json.failed).toBe(0)
    expect(sendReengagementInvite).toHaveBeenCalledWith(
      expect.objectContaining({ email: "u1@example.com", inviteUrl: expect.stringContaining("/convite/plaintext-token") })
    )
    expect(updateEq).toHaveBeenCalledWith("id", "00000000-0000-0000-0000-000000000001")
  })

  it("records a per-user failure instead of aborting the whole batch", async () => {
    ;(sendReengagementInvite as jest.Mock).mockResolvedValue({ success: false, error: "Brevo down" })
    const res = await POST(makeRequest({
      campaign: "c1",
      subject: "s",
      body: "b",
      userIds: ["00000000-0000-0000-0000-000000000001"]
    }))
    const json = await res.json()
    expect(json.success).toBe(0)
    expect(json.failed).toBe(1)
    expect(json.results[0].error).toContain("Brevo down")
  })

  it("logs a bulk_action admin audit entry", async () => {
    await POST(makeRequest({
      campaign: "c1",
      subject: "s",
      body: "b",
      userIds: ["00000000-0000-0000-0000-000000000001"]
    }))
    expect(logAdminAction).toHaveBeenCalledWith(
      "admin-1",
      "bulk_action",
      expect.objectContaining({ campaign: "c1" }),
      undefined,
      undefined,
      expect.anything()
    )
  })
})
