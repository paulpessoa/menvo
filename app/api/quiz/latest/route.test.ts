/**
 * @jest-environment node
 */
import { GET } from "./route"
import { createClient } from "@/lib/utils/supabase/server"
import { buildQuizService } from "@/lib/services/quiz/quiz.composition"

jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn() }))
jest.mock("@/lib/services/quiz/quiz.composition", () => ({ buildQuizService: jest.fn() }))

function mockSession(user: unknown, getLatest = jest.fn()) {
  ;(createClient as jest.Mock).mockResolvedValue({ auth: { getUser: jest.fn().mockResolvedValue({ data: { user } }) } })
  ;(buildQuizService as jest.Mock).mockReturnValue({ getLatest })
  return getLatest
}

beforeEach(() => jest.spyOn(console, "error").mockImplementation(() => {}))
afterEach(() => jest.restoreAllMocks())

describe("GET /api/quiz/latest", () => {
  it("401 without a session e-mail", async () => {
    mockSession(null)
    expect((await GET()).status).toBe(401)
  })

  it("asks for the session e-mail, never one from the request", async () => {
    const getLatest = mockSession({ email: "Ana@Example.com" }, jest.fn().mockResolvedValue(null))
    const res = await GET()
    expect(await res.json()).toEqual({ summary: null })
    expect(getLatest).toHaveBeenCalledWith("Ana@Example.com")
  })

  it("500 when the service throws", async () => {
    mockSession({ email: "a@b.co" }, jest.fn().mockRejectedValue(new Error("db")))
    expect((await GET()).status).toBe(500)
  })
})
