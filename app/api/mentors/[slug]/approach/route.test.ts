/**
 * @jest-environment node
 */
import { NextRequest } from "next/server"
import { GET } from "./route"
import { createClient } from "@/lib/utils/supabase/server"
import { buildMentorProfileService } from "@/lib/services/mentors/mentor-profile.composition"

jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn() }))
jest.mock("@/lib/services/mentors/mentor-profile.composition", () => ({ buildMentorProfileService: jest.fn() }))

const service = { getApproach: jest.fn() }
const getUser = jest.fn()

const call = (slug: string) =>
  GET(new NextRequest(`http://localhost/api/mentors/${slug}/approach`), { params: Promise.resolve({ slug }) })

beforeEach(() => {
  jest.clearAllMocks()
  ;(createClient as jest.Mock).mockResolvedValue({ auth: { getUser } })
  ;(buildMentorProfileService as jest.Mock).mockReturnValue(service)
  getUser.mockResolvedValue({ data: { user: { id: "u1" } } })
})

describe("GET /api/mentors/[slug]/approach", () => {
  it("404 for the literal 'undefined' slug, without touching the database", async () => {
    const res = await call("undefined")
    expect(res.status).toBe(404)
    expect(service.getApproach).not.toHaveBeenCalled()
  })

  it("passes whether the caller is logged in to the service", async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    service.getApproach.mockResolvedValue({ kind: "unauthorized" })
    const res = await call("ana")
    expect(service.getApproach).toHaveBeenCalledWith("ana", false)
    expect(res.status).toBe(401)
  })

  it("404 when the mentor is not listed", async () => {
    service.getApproach.mockResolvedValue({ kind: "not_found" })
    expect((await call("ghost")).status).toBe(404)
  })

  it("returns the texts in the same { data } shape as before", async () => {
    const approach = { mentorship_approach: "escuta ativa", what_to_expect: null }
    service.getApproach.mockResolvedValue({ kind: "ok", approach })
    const res = await call("ana")
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ data: approach })
  })
})
