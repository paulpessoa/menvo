/**
 * @jest-environment node
 */
import { POST } from "./route"
import { NextRequest } from "next/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { buildReengagementInviteHtml } from "@/lib/email/brevo"

jest.mock("@/lib/auth/require-admin", () => ({ requireAdmin: jest.fn() }))
jest.mock("@/lib/email/brevo", () => ({ buildReengagementInviteHtml: jest.fn() }))

const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>

function makeRequest(body: any) {
  return new NextRequest("http://localhost:3000/api/admin/invites/preview", {
    method: "POST",
    body: JSON.stringify(body)
  })
}

describe("POST /api/admin/invites/preview", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({ ok: true, admin: { userId: "admin-1", role: "admin" } })
  })

  it("rejects an empty body", async () => {
    const res = await POST(makeRequest({ body: "" }))
    expect(res.status).toBe(400)
  })

  it("returns the rendered html for a valid body", async () => {
    ;(buildReengagementInviteHtml as jest.Mock).mockReturnValue("<html>ok</html>")
    const res = await POST(makeRequest({ body: "Olá, {{primeiro_nome}}!" }))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.html).toBe("<html>ok</html>")
    expect(buildReengagementInviteHtml).toHaveBeenCalledWith(
      expect.objectContaining({ bodyText: "Olá, {{primeiro_nome}}!" })
    )
  })
})
