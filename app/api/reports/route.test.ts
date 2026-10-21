/**
 * @jest-environment node
 */
import { POST } from "./route"
import { createClient } from "@/lib/utils/supabase/server"

jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn() }))

function setup(userId: string | null, insertResult = { data: { id: "r1" } as { id: string } | null, error: null as { message: string } | null }) {
  const single = jest.fn().mockResolvedValue(insertResult)
  const insert = jest.fn().mockReturnValue({ select: () => ({ single }) })
  ;(createClient as jest.Mock).mockResolvedValue({
    from: jest.fn().mockReturnValue({ insert }),
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: userId ? { id: userId } : null }, error: null }) },
  })
  return insert
}
const req = (body: unknown) => new Request("http://localhost/api/reports", { method: "POST", body: JSON.stringify(body) })

describe("POST /api/reports", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => undefined)
  })

  it("401 without session", async () => {
    setup(null)
    expect((await POST(req({}))).status).toBe(401)
  })

  it("400 on invalid body", async () => {
    const insert = setup("u1")
    expect((await POST(req({ category: "spam" }))).status).toBe(400)
    expect(insert).not.toHaveBeenCalled()
  })

  it("400 when evidence belongs to someone else", async () => {
    const insert = setup("u1")
    const res = await POST(req({ category: "spam", description: "x", evidence_paths: ["u2/a.png"] }))
    expect(res.status).toBe(400)
    expect(insert).not.toHaveBeenCalled()
  })

  it("keeps the { success, reportId } response", async () => {
    const insert = setup("u1")
    const res = await POST(req({ category: "spam", description: "x", evidence_paths: ["u1/a.png"], reported_email: "" }))
    expect(await res.json()).toEqual({ success: true, reportId: "r1" })
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ reporter_id: "u1", reported_email: null, status: "pending" }))
  })

  it("500 when the insert fails", async () => {
    setup("u1", { data: null, error: { message: "boom" } })
    expect((await POST(req({ category: "spam", description: "x" }))).status).toBe(500)
  })
})
