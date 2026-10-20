/**
 * @jest-environment node
 */
import { NextRequest } from "next/server"
import { DELETE, GET, POST } from "./route"
import { createClient } from "@/lib/utils/supabase/server"
import { buildMembershipService } from "@/lib/services/organizations/membership.composition"

jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn() }))
jest.mock("@/lib/services/organizations/membership.composition", () => ({ buildMembershipService: jest.fn() }))

const ORG = "33333333-3333-4333-8333-333333333333"
const service = { listMine: jest.fn(), join: jest.fn(), leave: jest.fn() }

function session(user: { id: string; email?: string } | null) {
  ;(createClient as jest.Mock).mockResolvedValue({ auth: { getUser: async () => ({ data: { user } }) } })
}
const post = (body: unknown) =>
  POST(new NextRequest("http://localhost/api/me/organizations", { method: "POST", body: JSON.stringify(body) }))
const del = (query: string) => DELETE(new NextRequest(`http://localhost/api/me/organizations${query}`, { method: "DELETE" }))

beforeEach(() => {
  jest.clearAllMocks()
  ;(buildMembershipService as jest.Mock).mockReturnValue(service)
  session({ id: "u1", email: "u1@x.org" })
  jest.spyOn(console, "error").mockImplementation(() => {})
})
afterEach(() => jest.restoreAllMocks())

describe("auth", () => {
  it.each([
    ["GET", () => GET()],
    ["POST", () => post({ slug: "giral" })],
    ["DELETE", () => del(`?organizationId=${ORG}`)],
  ])("%s answers 401 without a session and never builds the service", async (_name, call) => {
    session(null)
    const res = await call()
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: "Não autenticado", code: "UNAUTHORIZED" })
    expect(buildMembershipService).not.toHaveBeenCalled()
  })
})

describe("GET", () => {
  it("wraps the memberships in { data }", async () => {
    service.listMine.mockResolvedValue([{ organization_id: ORG }])
    const res = await GET()
    expect(await res.json()).toEqual({ data: [{ organization_id: ORG }] })
    expect(service.listMine).toHaveBeenCalledWith({ id: "u1", email: "u1@x.org" })
  })
})

describe("POST", () => {
  it("rejects a body without a slug", async () => {
    const res = await post({ slug: "  " })
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: "Slug inválido", code: "VALIDATION_ERROR" })
    expect(service.join).not.toHaveBeenCalled()
  })

  it.each([
    [{ kind: "not_found" }, 404, { error: "Organização não encontrada", code: "NOT_FOUND" }],
    [
      { kind: "invite_only" },
      403,
      { error: "Esta organização entra apenas por convite. Peça a um administrador dela pra te convidar.", code: "FORBIDDEN" },
    ],
    [{ kind: "already_active" }, 200, { data: { status: "active" }, message: "Você já faz parte desta organização" }],
    [{ kind: "already_requested" }, 200, { data: { status: "requested" }, message: "Sua solicitação já está aguardando aprovação" }],
    [{ kind: "accepted", orgName: "Giral" }, 200, { data: { status: "active" }, message: "Você agora faz parte da Giral" }],
    [{ kind: "requested" }, 200, { data: { status: "requested" }, message: "Solicitação enviada - aguarde a aprovação da organização" }],
  ])("translates %j to status %i with the same body as before", async (outcome, status, body) => {
    service.join.mockResolvedValue(outcome)
    const res = await post({ slug: "giral" })
    expect(res.status).toBe(status)
    expect(await res.json()).toEqual(body)
    expect(service.join).toHaveBeenCalledWith({ id: "u1", email: "u1@x.org" }, "giral")
  })

  it("answers 500 when the service throws", async () => {
    service.join.mockRejectedValue(new Error("boom"))
    expect((await post({ slug: "giral" })).status).toBe(500)
  })
})

describe("DELETE", () => {
  it("asks for the organization id", async () => {
    const res = await del("")
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: "organizationId é obrigatório" })
  })

  it("rejects an id that is not a UUID", async () => {
    const res = await del("?organizationId=x")
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: "organizationId inválido" })
    expect(service.leave).not.toHaveBeenCalled()
  })

  it("leaves only as the session user and echoes the id", async () => {
    service.leave.mockResolvedValue(undefined)
    const res = await del(`?organizationId=${ORG}`)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ data: { organizationId: ORG }, message: "Você saiu da organização" })
    expect(service.leave).toHaveBeenCalledWith({ id: "u1", email: "u1@x.org" }, ORG)
  })
})
