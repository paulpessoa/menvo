/**
 * @jest-environment node
 */
import { NextRequest } from "next/server"
import { GET } from "./route"

const getPublicMentor = jest.fn()

jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn(async () => ({})) }))
jest.mock("@/lib/services/mentors/mentor-profile.composition", () => ({
  buildMentorProfileService: jest.fn(() => ({ getPublicMentor })),
}))

const call = (slug: string) =>
  GET(new NextRequest(`http://localhost/api/mentors/${slug}`), { params: Promise.resolve({ slug }) })

describe("GET /api/mentors/[slug]", () => {
  beforeEach(() => getPublicMentor.mockReset())

  it("returns the mentor", async () => {
    getPublicMentor.mockResolvedValue({ id: "m1", slug: "ana" })
    const res = await call("ana")
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ mentor: { id: "m1", slug: "ana" } })
  })

  it("answers 404 for a mentor the directory does not list", async () => {
    getPublicMentor.mockResolvedValue(null)
    const res = await call("ghost")
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Mentor não encontrado" })
  })

  it("answers 404 without touching the service for the literal 'undefined' slug", async () => {
    expect((await call("undefined")).status).toBe(404)
    expect(getPublicMentor).not.toHaveBeenCalled()
  })

  it("answers 500 (not 404) when the database fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined)
    getPublicMentor.mockRejectedValue(new Error("db down"))
    expect((await call("ana")).status).toBe(500)
  })
})
