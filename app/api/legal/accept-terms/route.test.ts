/**
 * @jest-environment node
 */
import { NextRequest } from "next/server"
import { GET, POST } from "./route"
import { createClient } from "@/lib/utils/supabase/server"
import { CURRENT_TERMS_VERSION } from "@/lib/legal/terms"

jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn() }))

function makeSupabase({
  userId = "user-1" as string | null,
  existing = null as { id: string } | null,
  selectError = null as { message: string } | null,
  insertError = null as { code?: string; message: string } | null,
} = {}) {
  const maybeSingle = jest.fn().mockResolvedValue({ data: existing, error: selectError })
  const eqVersion = jest.fn().mockReturnValue({ maybeSingle })
  const eqUser = jest.fn().mockReturnValue({ eq: eqVersion })
  const select = jest.fn().mockReturnValue({ eq: eqUser })
  const insert = jest.fn().mockResolvedValue({ error: insertError })
  return {
    insert,
    eqVersion,
    client: {
      from: jest.fn().mockReturnValue({ select, insert }),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: userId ? { id: userId } : null } }),
      },
    },
  }
}

function postRequest(userAgent = "jest-agent") {
  return new NextRequest("http://localhost/api/legal/accept-terms", {
    method: "POST",
    headers: { "user-agent": userAgent },
  })
}

describe("/api/legal/accept-terms", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, "error").mockImplementation(() => undefined)
  })

  it("rejects unauthenticated callers", async () => {
    ;(createClient as jest.Mock).mockResolvedValue(makeSupabase({ userId: null }).client)

    expect((await GET()).status).toBe(401)
    expect((await POST(postRequest())).status).toBe(401)
  })

  it("GET reports not accepted when there is no row for the current version", async () => {
    const mock = makeSupabase({ existing: null })
    ;(createClient as jest.Mock).mockResolvedValue(mock.client)

    const res = await GET()

    expect(await res.json()).toEqual({ accepted: false })
    expect(mock.eqVersion).toHaveBeenCalledWith("terms_version", CURRENT_TERMS_VERSION)
  })

  it("GET reports accepted when a row exists", async () => {
    ;(createClient as jest.Mock).mockResolvedValue(makeSupabase({ existing: { id: "t1" } }).client)

    expect(await (await GET()).json()).toEqual({ accepted: true })
  })

  it("GET returns 500 on a query error instead of claiming not accepted", async () => {
    ;(createClient as jest.Mock).mockResolvedValue(
      makeSupabase({ selectError: { message: "boom" } }).client,
    )

    expect((await GET()).status).toBe(500)
  })

  it("POST inserts the session user, current version and user agent", async () => {
    const mock = makeSupabase()
    ;(createClient as jest.Mock).mockResolvedValue(mock.client)

    const res = await POST(postRequest("Mozilla/5.0 test"))

    expect(res.status).toBe(200)
    expect(mock.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      terms_version: CURRENT_TERMS_VERSION,
      user_agent: "Mozilla/5.0 test",
    })
  })

  it("POST treats an already-accepted version (23505) as success", async () => {
    const mock = makeSupabase({ insertError: { code: "23505", message: "duplicate" } })
    ;(createClient as jest.Mock).mockResolvedValue(mock.client)

    expect((await POST(postRequest())).status).toBe(200)
  })

  it("POST returns 500 on any other database error", async () => {
    const mock = makeSupabase({ insertError: { code: "42501", message: "denied" } })
    ;(createClient as jest.Mock).mockResolvedValue(mock.client)

    expect((await POST(postRequest())).status).toBe(500)
  })

  it("POST truncates an oversized user agent to the table limit", async () => {
    const mock = makeSupabase()
    ;(createClient as jest.Mock).mockResolvedValue(mock.client)

    await POST(postRequest("x".repeat(1000)))

    const row = mock.insert.mock.calls[0][0] as { user_agent: string }
    expect(row.user_agent).toHaveLength(400)
  })
})
