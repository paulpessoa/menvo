/**
 * @jest-environment node
 */
import { NextRequest } from "next/server"

const mockFrom = jest.fn()
const mockGetSessionUser = jest.fn()

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: jest.fn() },
    from: (...args: unknown[]) => mockFrom(...args),
  })),
}))

jest.mock("@/lib/utils/supabase/server", () => ({
  createClient: jest.fn(async () => ({ auth: { getUser: mockGetSessionUser } })),
}))

let POST: (request: NextRequest) => Promise<Response>
let DELETE: (request: NextRequest) => Promise<Response>

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321"
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test-key"
  ;({ POST, DELETE } = require("./route"))
})

const call = (method: "POST" | "DELETE", body?: unknown) =>
  (method === "POST" ? POST : DELETE)(
    new NextRequest("http://localhost:3000/api/profile/onboarding", {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  )

/** `profiles` falso com flags já gravadas; devolve o que foi escrito. */
function mockProfile(flags: Record<string, unknown>, writeError: { message: string } | null = null) {
  const written: unknown[] = []
  mockFrom.mockImplementation(() => ({
    select: () => ({ eq: () => ({ single: async () => ({ data: { onboarding_flags: flags }, error: null }) }) }),
    update: (fields: unknown) => {
      written.push(fields)
      return { eq: async () => ({ error: writeError }) }
    },
  }))
  return written
}

describe("/api/profile/onboarding", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null })
  })

  it("returns 401 without a session", async () => {
    mockGetSessionUser.mockResolvedValue({ data: { user: null }, error: null })
    const res = await call("POST", { flag: "ob_m1", value: "x" })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: "Unauthorized" })
  })

  it("keeps the old 400 message when flag or value is missing", async () => {
    mockProfile({})
    for (const body of [{}, { flag: "ob_m1" }, { value: "x" }]) {
      const res = await call("POST", body)
      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({ error: "Missing flag or value" })
    }
  })

  it("rejects a flag key that is not a tour id", async () => {
    mockProfile({})
    const res = await call("POST", { flag: "a key with spaces", value: "x" })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "Invalid flag or value" })
  })

  it("stores the flag next to the existing ones and returns them", async () => {
    const written = mockProfile({ ob_m1: "2026-10-01" })
    const res = await call("POST", { flag: "ob_m2", value: "2026-10-19" })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      success: true,
      onboarding_flags: { ob_m1: "2026-10-01", ob_m2: "2026-10-19" },
    })
    expect(written).toEqual([{ onboarding_flags: { ob_m1: "2026-10-01", ob_m2: "2026-10-19" } }])
  })

  it("answers 500 with the database message when the write fails", async () => {
    mockProfile({}, { message: "denied" })
    const res = await call("POST", { flag: "ob_m1", value: "x" })
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: "denied" })
  })

  it("DELETE clears all the flags", async () => {
    const written = mockProfile({ ob_m1: "x" })
    const res = await call("DELETE")
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, onboarding_flags: {} })
    expect(written).toEqual([{ onboarding_flags: {} }])
  })
})
