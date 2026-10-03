/**
 * @jest-environment node
 */
import { NextRequest } from "next/server"
import { POST } from "./route"
import { createClient } from "@/lib/utils/supabase/server"
import { buildQuizService } from "@/lib/services/quiz/quiz.composition"

jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn() }))
jest.mock("@/lib/services/quiz/quiz.composition", () => ({ buildQuizService: jest.fn() }))

const ID = "33333333-3333-3333-3333-333333333333"
const call = (id = ID) => POST(new NextRequest("http://localhost/x", { method: "POST" }), { params: Promise.resolve({ id }) })

function mockRun(runAnalysis: jest.Mock, user: unknown = null) {
  ;(createClient as jest.Mock).mockResolvedValue({ auth: { getUser: jest.fn().mockResolvedValue({ data: { user } }) } })
  ;(buildQuizService as jest.Mock).mockReturnValue({ runAnalysis })
}

const OLD_KEY = process.env.AI_METERING_KEY
beforeEach(() => {
  jest.clearAllMocks()
  process.env.AI_METERING_KEY = "server-key"
  jest.spyOn(console, "warn").mockImplementation(() => {})
})
afterEach(() => {
  if (OLD_KEY === undefined) delete process.env.AI_METERING_KEY
  else process.env.AI_METERING_KEY = OLD_KEY
  jest.restoreAllMocks()
})

describe("POST /api/quiz/[id]/analyze", () => {
  it("400 for a non-UUID id", async () => {
    expect((await call("nope")).status).toBe(400)
  })

  it("503 when the metering key is not configured, before any work", async () => {
    delete process.env.AI_METERING_KEY
    mockRun(jest.fn())
    expect((await call()).status).toBe(503)
    expect(buildQuizService).not.toHaveBeenCalled()
  })

  it("500 when the claim fails", async () => {
    mockRun(jest.fn().mockResolvedValue({ kind: "claim_failed" }))
    expect((await call()).status).toBe(500)
  })

  it("not claimed is a 200 with claimed:false (the results page polls anyway)", async () => {
    mockRun(jest.fn().mockResolvedValue({ kind: "not_claimed" }))
    const res = await call()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, claimed: false })
  })

  it("done is claimed:true and passes the session state through", async () => {
    const run = jest.fn().mockResolvedValue({ kind: "done" })
    mockRun(run, { id: "u1" })
    expect(await (await call()).json()).toEqual({ ok: true, claimed: true })
    expect(run).toHaveBeenCalledWith({ id: ID, serverKey: "server-key", isAuthenticated: true })
  })
})
