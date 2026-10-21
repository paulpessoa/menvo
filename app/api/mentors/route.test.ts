/**
 * @jest-environment node
 */
import { NextRequest } from "next/server"
import { GET } from "./route"

const listPublicMentors = jest.fn()

jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn(async () => ({})) }))
jest.mock("@/lib/services/mentors/mentor-profile.composition", () => ({
  buildMentorProfileService: jest.fn(() => ({ listPublicMentors })),
}))

const A = "11111111-1111-4111-8111-111111111111"
const B = "22222222-2222-4222-8222-222222222222"

const call = (query: string) => GET(new NextRequest(`http://localhost/api/mentors${query}`))

describe("GET /api/mentors", () => {
  beforeEach(() => listPublicMentors.mockReset())

  it("returns the mentors for valid ids, without requiring a session", async () => {
    listPublicMentors.mockResolvedValue([{ id: A }, { id: B }])
    const res = await call(`?ids=${A},${B}`)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ mentors: [{ id: A }, { id: B }] })
    expect(listPublicMentors).toHaveBeenCalledWith([A, B])
  })

  it.each(["", "?ids=", "?ids=nope", `?ids=${A},nope`])("rejects %j with 400", async (query) => {
    const res = await call(query)
    expect(res.status).toBe(400)
    expect(typeof (await res.json()).error).toBe("string")
    expect(listPublicMentors).not.toHaveBeenCalled()
  })

  it("rejects more than 50 ids", async () => {
    const ids = Array.from({ length: 51 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`)
    expect((await call(`?ids=${ids.join(",")}`)).status).toBe(400)
  })

  it("answers 500 with a pt-BR message when the service fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined)
    listPublicMentors.mockRejectedValue(new Error("db down"))
    const res = await call(`?ids=${A}`)
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: "Não foi possível carregar os mentores" })
  })
})
