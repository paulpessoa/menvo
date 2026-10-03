/**
 * @jest-environment node
 */
import { NextRequest } from "next/server"
import { GET } from "./route"
import { createClient } from "@/lib/utils/supabase/server"
import { buildQuizService } from "@/lib/services/quiz/quiz.composition"

jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn() }))
jest.mock("@/lib/services/quiz/quiz.composition", () => ({ buildQuizService: jest.fn() }))

const ID = "33333333-3333-3333-3333-333333333333"
const call = (id: string) => GET(new NextRequest("http://localhost/api/quiz/x"), { params: Promise.resolve({ id }) })

function mockService(getResult: jest.Mock, user: unknown = null) {
  ;(createClient as jest.Mock).mockResolvedValue({ auth: { getUser: jest.fn().mockResolvedValue({ data: { user } }) } })
  ;(buildQuizService as jest.Mock).mockReturnValue({ getResult })
}

beforeEach(() => jest.spyOn(console, "error").mockImplementation(() => {}))
afterEach(() => jest.restoreAllMocks())

describe("GET /api/quiz/[id]", () => {
  it("400 for an id that is not a UUID, without touching the service", async () => {
    mockService(jest.fn())
    const res = await call("not-a-uuid")
    expect(res.status).toBe(400)
    expect(buildQuizService).not.toHaveBeenCalled()
  })

  it("404 when the result does not exist", async () => {
    mockService(jest.fn().mockResolvedValue(null))
    expect((await call(ID)).status).toBe(404)
  })

  it("200 with the public view; the session only decides is_owner", async () => {
    const getResult = jest.fn().mockResolvedValue({ id: ID, processed_at: null, ai_analysis: null, is_owner: true })
    mockService(getResult, { id: "u1" })
    const res = await call(ID)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ id: ID, processed_at: null, ai_analysis: null, is_owner: true })
    expect(getResult).toHaveBeenCalledWith(ID, true)
  })

  it("500 when the service throws", async () => {
    mockService(jest.fn().mockRejectedValue(new Error("rpc")))
    expect((await call(ID)).status).toBe(500)
  })
})
