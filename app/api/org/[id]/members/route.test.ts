/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from "next/server"
import { DELETE, PATCH, POST } from "./route"
import { requireOrgAdmin } from "@/lib/auth/require-org-admin"
import { buildOrgAdminService } from "@/lib/services/organizations/org-admin.composition"

jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn().mockResolvedValue({}) }))
jest.mock("@/lib/auth/require-org-admin", () => ({ requireOrgAdmin: jest.fn() }))
jest.mock("@/lib/services/organizations/org-admin.composition", () => ({ buildOrgAdminService: jest.fn() }))

const ORG = "33333333-3333-4333-8333-333333333333"
const USER = "44444444-4444-4444-8444-444444444444"
const ADMIN = "55555555-5555-4555-8555-555555555555"
const service = { invite: jest.fn(), approve: jest.fn(), remove: jest.fn() }
const params = (id: string = ORG) => ({ params: Promise.resolve({ id }) })
const req = (method: string, body?: unknown, query = "") =>
  new NextRequest(`http://localhost/api/org/${ORG}/members${query}`, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { "content-type": "application/json" } }),
  })

function allow() {
  ;(requireOrgAdmin as jest.Mock).mockResolvedValue({ ok: true, admin: { userId: ADMIN, organizationId: ORG } })
}
function deny(status: number) {
  ;(requireOrgAdmin as jest.Mock).mockResolvedValue({
    ok: false,
    response: NextResponse.json({ error: "x", code: "X" }, { status }),
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  ;(buildOrgAdminService as jest.Mock).mockReturnValue(service)
  jest.spyOn(console, "error").mockImplementation(() => {})
  allow()
})
afterEach(() => jest.restoreAllMocks())

describe("POST /api/org/[id]/members (invite)", () => {
  it("passes through the guard's 401 and 403 without touching the service", async () => {
    for (const status of [401, 403]) {
      deny(status)
      expect((await POST(req("POST", { email: "a@x.org" }), params())).status).toBe(status)
    }
    expect(service.invite).not.toHaveBeenCalled()
  })

  it("answers 400 for an id that is not a UUID", async () => {
    expect((await POST(req("POST", { email: "a@x.org" }), params("nope"))).status).toBe(400)
    expect(requireOrgAdmin).not.toHaveBeenCalled()
  })

  it("answers 400 with the schema message for a bad e-mail", async () => {
    const res = await POST(req("POST", { email: "not-an-email" }), params())
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "E-mail inválido", code: "VALIDATION_ERROR" })
  })

  it("lowercases the e-mail before the lookup", async () => {
    service.invite.mockResolvedValue({ kind: "invited" })
    await POST(req("POST", { email: " Ana@X.org " }), params())
    expect(service.invite).toHaveBeenCalledWith(ORG, "ana@x.org")
  })

  it.each([
    [{ kind: "no_account" }, 404, undefined, "NOT_FOUND"],
    [{ kind: "already_active" }, 200, "Essa pessoa já faz parte da organização", "active"],
    [{ kind: "reinvited" }, 200, "Convite reenviado", "invited"],
    [{ kind: "approved" }, 200, "Solicitação pendente aprovada", "active"],
    [{ kind: "invited" }, 200, "Convite enviado", "invited"],
  ])("maps %j to the same status and message as before", async (outcome, status, message, extra) => {
    service.invite.mockResolvedValue(outcome)
    const res = await POST(req("POST", { email: "a@x.org" }), params())
    const body = await res.json()
    expect(res.status).toBe(status)
    if (status === 404) expect(body.code).toBe(extra)
    else expect(body).toEqual({ data: { status: extra }, message })
  })

  it("answers 500 when the service throws", async () => {
    service.invite.mockRejectedValue(new Error("db down"))
    expect((await POST(req("POST", { email: "a@x.org" }), params())).status).toBe(500)
  })
})

describe("PATCH /api/org/[id]/members (approve)", () => {
  it("passes through the guard's 403", async () => {
    deny(403)
    expect((await PATCH(req("PATCH", { userId: USER }), params())).status).toBe(403)
    expect(service.approve).not.toHaveBeenCalled()
  })

  it("answers 400 'userId inválido' for a missing or malformed userId", async () => {
    const res = await PATCH(req("PATCH", { userId: "x" }), params())
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "userId inválido", code: "VALIDATION_ERROR" })
  })

  it("answers 404 when there is no pending request", async () => {
    service.approve.mockResolvedValue({ kind: "not_found" })
    const res = await PATCH(req("PATCH", { userId: USER }), params())
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Solicitação não encontrada", code: "NOT_FOUND" })
  })

  it("answers 200 with the active status", async () => {
    service.approve.mockResolvedValue({ kind: "approved" })
    const res = await PATCH(req("PATCH", { userId: USER }), params())
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ data: { status: "active" }, message: "Participação aprovada" })
    expect(service.approve).toHaveBeenCalledWith(ORG, USER)
  })
})

describe("DELETE /api/org/[id]/members", () => {
  it("passes through the guard's 401", async () => {
    deny(401)
    expect((await DELETE(req("DELETE", undefined, `?userId=${USER}`), params())).status).toBe(401)
    expect(service.remove).not.toHaveBeenCalled()
  })

  it("answers 400 'userId é obrigatório' without the query", async () => {
    const res = await DELETE(req("DELETE"), params())
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "userId é obrigatório", code: "VALIDATION_ERROR" })
  })

  it("refuses to remove oneself with the same 400 as before", async () => {
    service.remove.mockResolvedValue({ kind: "self" })
    const res = await DELETE(req("DELETE", undefined, `?userId=${ADMIN}`), params())
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      error: "Use a aba Organizações do seu perfil para sair da organização",
      code: "BAD_REQUEST",
    })
    expect(service.remove).toHaveBeenCalledWith(ADMIN, ORG, ADMIN)
  })

  it("D4: refuses the last active admin with 400 BAD_REQUEST", async () => {
    service.remove.mockResolvedValue({ kind: "last_admin" })
    const res = await DELETE(req("DELETE", undefined, `?userId=${USER}`), params())
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: "BAD_REQUEST" })
  })

  it("answers 200 with the removed userId", async () => {
    service.remove.mockResolvedValue({ kind: "removed" })
    const res = await DELETE(req("DELETE", undefined, `?userId=${USER}`), params())
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ data: { userId: USER }, message: "Membro removido" })
  })
})
