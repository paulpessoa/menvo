/**
 * @jest-environment node
 */
import { NextRequest } from "next/server"
import { GET } from "./route"
import { createClient } from "@/lib/utils/supabase/server"
import { buildCommunityService } from "@/lib/services/community/community.composition"

jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn() }))
jest.mock("@/lib/services/community/community.composition", () => ({ buildCommunityService: jest.fn() }))

const A = "11111111-1111-4111-8111-111111111111"
const service = { getProfilesByIds: jest.fn() }
const getUser = jest.fn()
const call = (qs: string) => GET(new NextRequest(`http://localhost/api/community/profiles${qs}`))

beforeEach(() => {
  jest.clearAllMocks()
  ;(createClient as jest.Mock).mockResolvedValue({ auth: { getUser } })
  ;(buildCommunityService as jest.Mock).mockReturnValue(service)
  getUser.mockResolvedValue({ data: { user: { id: "u1" } } })
})

describe("GET /api/community/profiles", () => {
  it("401 without a session, before touching the service", async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    const res = await call(`?ids=${A}`)
    expect(res.status).toBe(401)
    expect(buildCommunityService).not.toHaveBeenCalled()
  })

  it("400 with more than 50 ids", async () => {
    const res = await call(`?ids=${Array(51).fill(A).join(",")}`)
    expect(res.status).toBe(400)
    expect((await res.json()).error).toEqual(expect.any(String))
  })

  it("passes only valid ids to the service and returns { profiles }", async () => {
    service.getProfilesByIds.mockResolvedValue([{ id: A }])
    const res = await call(`?ids=bad,${A}`)
    expect(service.getProfilesByIds).toHaveBeenCalledWith([A])
    expect(await res.json()).toEqual({ profiles: [{ id: A }] })
  })

  it("500 with { error } when the service fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {})
    service.getProfilesByIds.mockRejectedValue(new Error("db"))
    const res = await call(`?ids=${A}`)
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: expect.any(String) })
  })
})