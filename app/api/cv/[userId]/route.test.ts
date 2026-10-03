/**
 * @jest-environment node
 */
import { NextRequest } from "next/server"
import { GET } from "./route"

const OWNER = "0737122a-0579-4981-9802-41883d6563a3"

const mockGetUser = jest.fn()
const mockRpc = jest.fn()
const mockDownload = jest.fn()

jest.mock("@/lib/utils/supabase/server", () => ({
  createClient: jest.fn(async () => ({ auth: { getUser: mockGetUser }, rpc: mockRpc })),
}))

jest.mock("@/lib/utils/supabase/service-role", () => ({
  createServiceRoleClient: jest.fn(() => ({
    storage: { from: jest.fn(() => ({ download: mockDownload })) },
  })),
}))

function call(userId: string) {
  return GET(new NextRequest(`http://localhost/api/cv/${userId}`), { params: Promise.resolve({ userId }) })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetUser.mockResolvedValue({ data: { user: { id: OWNER } } })
  mockRpc.mockResolvedValue({ data: `${OWNER}/cv-1.pdf`, error: null })
  mockDownload.mockResolvedValue({ data: new Blob(["%PDF-1.4"], { type: "application/pdf" }), error: null })
})

describe("GET /api/cv/[userId]", () => {
  it("streams the PDF from the Menvo domain when access is allowed", async () => {
    const response = await call(OWNER)

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toBe("application/pdf")
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    expect(mockRpc).toHaveBeenCalledWith("profile_cv_url", { p_user_id: OWNER })
    expect(mockDownload).toHaveBeenCalledWith(`${OWNER}/cv-1.pdf`)
  })

  it("requires a session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    expect((await call(OWNER)).status).toBe(401)
    expect(mockDownload).not.toHaveBeenCalled()
  })

  it("returns 404 when profile_cv_url denies access", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null })
    expect((await call(OWNER)).status).toBe(404)
    expect(mockDownload).not.toHaveBeenCalled()
  })

  it("never serves a file outside the owner's paths", async () => {
    mockRpc.mockResolvedValue({ data: "11ee6e45-eb1c-49ed-9897-dcd592719279/cv-1.pdf", error: null })
    expect((await call(OWNER)).status).toBe(404)
    expect(mockDownload).not.toHaveBeenCalled()
  })

  it("rejects ids that are not UUIDs", async () => {
    expect((await call("../secret")).status).toBe(404)
    expect(mockRpc).not.toHaveBeenCalled()
  })
})
