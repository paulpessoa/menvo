/**
 * @jest-environment node
 */
import { requireOrgAdmin } from "./require-org-admin"
import { createClient } from "@/lib/utils/supabase/server"

jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn() }))

const ORG = "o1"

/** Client falso: usuário da sessão, papéis de plataforma e o resultado da RPC is_org_admin. */
function withClient(opts: { user: { id: string } | null; roles?: string[]; isOrgAdmin?: boolean }) {
  const rpc = jest.fn().mockResolvedValue({ data: opts.isOrgAdmin ?? false, error: null })
  const rolesResult = { data: (opts.roles ?? []).map(name => ({ user_id: "u1", roles: { name } })), error: null }
  const from = jest.fn(() => ({ select: () => ({ in: () => Promise.resolve(rolesResult) }) }))
  ;(createClient as jest.Mock).mockResolvedValue({
    auth: { getUser: async () => ({ data: { user: opts.user }, error: null }) },
    from,
    rpc,
  })
  return { rpc, from }
}

beforeEach(() => jest.clearAllMocks())

describe("requireOrgAdmin", () => {
  it("answers 401 UNAUTHORIZED without a session", async () => {
    withClient({ user: null })
    const result = await requireOrgAdmin(ORG)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(401)
      expect(await result.response.json()).toEqual({ error: "Não autenticado", code: "UNAUTHORIZED" })
    }
  })

  it("lets a platform admin through without asking the RPC", async () => {
    const { rpc } = withClient({ user: { id: "u1" }, roles: ["admin"] })
    const result = await requireOrgAdmin(ORG)
    expect(result).toEqual({ ok: true, admin: { userId: "u1", organizationId: ORG, isPlatformAdmin: true } })
    expect(rpc).not.toHaveBeenCalled()
  })

  it("lets an active org admin through, asked via the is_org_admin RPC", async () => {
    const { rpc } = withClient({ user: { id: "u1" }, roles: ["mentor"], isOrgAdmin: true })
    const result = await requireOrgAdmin(ORG)
    expect(result).toEqual({ ok: true, admin: { userId: "u1", organizationId: ORG, isPlatformAdmin: false } })
    expect(rpc).toHaveBeenCalledWith("is_org_admin", { p_organization_id: ORG })
  })

  it("answers 403 FORBIDDEN for anyone else", async () => {
    withClient({ user: { id: "u1" }, isOrgAdmin: false })
    const result = await requireOrgAdmin(ORG)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(403)
      expect(await result.response.json()).toEqual({ error: "Acesso negado", code: "FORBIDDEN" })
    }
  })
})
