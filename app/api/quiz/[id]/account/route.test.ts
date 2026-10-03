/**
 * @jest-environment node
 */
import { NextRequest } from "next/server"
import { GET, POST } from "./route"
import { checkRateLimit } from "@/lib/rate-limit"
import { createClient } from "@/lib/utils/supabase/server"
import { buildQuizService } from "@/lib/services/quiz/quiz.composition"

jest.mock("@/lib/rate-limit", () => ({ checkRateLimit: jest.fn() }))
jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn() }))
jest.mock("@/lib/services/quiz/quiz.composition", () => ({ buildQuizService: jest.fn() }))

const ID = "33333333-3333-3333-3333-333333333333"
const TOKEN = "t".repeat(20)

const get = (id: string, k?: string) =>
  GET(new NextRequest(`http://localhost/x${k ? `?k=${k}` : ""}`), { params: Promise.resolve({ id }) })
const post = (body: unknown, id = ID) =>
  POST(
    new NextRequest("http://localhost/x", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } }),
    { params: Promise.resolve({ id }) }
  )

function mockService(service: object) {
  ;(buildQuizService as jest.Mock).mockReturnValue(service)
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(checkRateLimit as jest.Mock).mockReturnValue({ allowed: true })
  ;(createClient as jest.Mock).mockResolvedValue({})
})

describe("GET /api/quiz/[id]/account", () => {
  it("403 without a token or with a non-UUID id, never reaching the service", async () => {
    expect((await get(ID)).status).toBe(403)
    expect((await get("nope", TOKEN)).status).toBe(403)
    expect(buildQuizService).not.toHaveBeenCalled()
  })

  it("403 when the service rejects the token", async () => {
    mockService({ checkAccountLink: jest.fn().mockResolvedValue(null) })
    expect((await get(ID, TOKEN)).status).toBe(403)
  })

  it("returns the link status", async () => {
    mockService({ checkAccountLink: jest.fn().mockResolvedValue({ status: "claimable", email: "a@b.co" }) })
    expect(await (await get(ID, TOKEN)).json()).toEqual({ status: "claimable", email: "a@b.co" })
  })
})

describe("POST /api/quiz/[id]/account", () => {
  it("429 when rate limited", async () => {
    ;(checkRateLimit as jest.Mock).mockReturnValue({ allowed: false })
    expect((await post({ token: TOKEN, password: "123456" })).status).toBe(429)
  })

  it("400 with the password rule message for a short password", async () => {
    const res = await post({ token: TOKEN, password: "123" })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe("A senha deve ter no mínimo 6 caracteres.")
  })

  it("403 for a non-UUID id", async () => {
    expect((await post({ token: TOKEN, password: "123456" }, "nope")).status).toBe(403)
  })

  it.each([
    [{ kind: "invalid_link" }, 403, { error: "Link inválido ou expirado" }],
    [{ kind: "exists", email: "a@b.co" }, 409, { status: "exists", email: "a@b.co" }],
    [{ kind: "password_rejected", message: "senha fraca" }, 400, { error: "senha fraca" }],
    [{ kind: "failed" }, 500, { error: "Não foi possível criar sua conta" }],
    [{ kind: "created", email: "a@b.co" }, 200, { ok: true, email: "a@b.co" }],
  ])("maps %j to %i", async (outcome, status, body) => {
    mockService({ createAccountFromResults: jest.fn().mockResolvedValue(outcome) })
    const res = await post({ token: TOKEN, password: "123456" })
    expect(res.status).toBe(status)
    expect(await res.json()).toEqual(body)
  })
})
