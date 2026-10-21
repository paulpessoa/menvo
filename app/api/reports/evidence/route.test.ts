/**
 * @jest-environment node
 */
import { POST } from "./route"
import { createClient } from "@/lib/utils/supabase/server"

jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn() }))

function setup(userId: string | null, uploadError: { message: string } | null = null) {
  const upload = jest.fn().mockResolvedValue({ error: uploadError })
  const from = jest.fn().mockReturnValue({ upload })
  ;(createClient as jest.Mock).mockResolvedValue({
    storage: { from },
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: userId ? { id: userId } : null }, error: null }) },
  })
  return { upload, from }
}
function req(file?: File) {
  const form = new FormData()
  if (file) form.append("file", file)
  return new Request("http://localhost/api/reports/evidence", { method: "POST", body: form })
}

describe("POST /api/reports/evidence", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => undefined)
  })

  it("401 without session", async () => {
    setup(null)
    expect((await POST(req(new File(["x"], "a.png", { type: "image/png" })))).status).toBe(401)
  })

  it("400 without file or with a disallowed type", async () => {
    setup("u1")
    expect((await POST(req())).status).toBe(400)
    expect((await POST(req(new File(["x"], "a.html", { type: "text/html" })))).status).toBe(400)
  })

  it("uploads under the user folder, ignoring the client file name", async () => {
    const { upload, from } = setup("u1")
    const res = await POST(req(new File(["x"], "../../evil.png", { type: "image/png" })))
    const { path } = await res.json()
    expect(path).toMatch(/^u1\/\d+_[0-9a-f-]{36}\.png$/)
    expect(from).toHaveBeenCalledWith("reports_evidence")
    expect(upload).toHaveBeenCalledWith(path, expect.any(Uint8Array), { contentType: "image/png", upsert: false })
  })

  it("500 when storage refuses", async () => {
    setup("u1", { message: "policy" })
    expect((await POST(req(new File(["x"], "a.png", { type: "image/png" })))).status).toBe(500)
  })
})
