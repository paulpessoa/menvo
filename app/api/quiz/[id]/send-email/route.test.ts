/**
 * @jest-environment node
 */
import { NextRequest } from "next/server"
import { POST } from "./route"
import { checkRateLimit } from "@/lib/rate-limit"
import { createClient } from "@/lib/utils/supabase/server"
import { buildQuizService } from "@/lib/services/quiz/quiz.composition"

jest.mock("@/lib/rate-limit", () => ({ checkRateLimit: jest.fn() }))
jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn() }))
jest.mock("@/lib/services/quiz/quiz.composition", () => ({ buildQuizService: jest.fn() }))

const ID = "33333333-3333-3333-3333-333333333333"
const call = (id = ID) => POST(new NextRequest("http://localhost/x", { method: "POST" }), { params: Promise.resolve({ id }) })

beforeEach(() => {
  jest.clearAllMocks()
  ;(checkRateLimit as jest.Mock).mockReturnValue({ allowed: true })
  ;(createClient as jest.Mock).mockResolvedValue({})
})

describe("POST /api/quiz/[id]/send-email", () => {
  it("400 for a non-UUID id", async () => {
    expect((await call("nope")).status).toBe(400)
  })

  it("429 when the per-id limit is hit, without calling the service", async () => {
    ;(checkRateLimit as jest.Mock).mockReturnValue({ allowed: false })
    expect((await call()).status).toBe(429)
    expect(buildQuizService).not.toHaveBeenCalled()
  })

  it.each([
    ["not_found", 404],
    ["not_ready", 409],
    ["failed", 500],
    ["sent", 200],
  ])("maps %s to %i", async (outcome, status) => {
    ;(buildQuizService as jest.Mock).mockReturnValue({ sendResults: jest.fn().mockResolvedValue(outcome) })
    expect((await call()).status).toBe(status)
  })
})
