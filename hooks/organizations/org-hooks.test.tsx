import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { ApiClientError } from "@/lib/query/http"
import { orgEffects } from "@/lib/query/effects/org"
import { orgKeys } from "@/lib/query/keys/org"
import { useJoinOrganization } from "./useJoinOrganization"
import { useLeaveOrganization } from "./useLeaveOrganization"
import { useMyMemberships } from "./useMyMemberships"

const ORG = "33333333-3333-4333-8333-333333333333"

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  return { qc, wrapper }
}

function mockFetch(handler: (url: string, init?: RequestInit) => { status: number; body: unknown }) {
  global.fetch = jest.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const { status, body } = handler(String(url), init)
    return { ok: status < 400, status, json: async () => body } as Response
  }) as never
  return global.fetch as jest.Mock
}

const membership = (over: object = {}) => ({
  organization_id: ORG,
  role: "member",
  status: "active",
  created_at: "2026-01-01",
  organizations: { id: ORG, slug: "giral", name: "Giral", type: "ngo", status: "active" },
  ...over,
})

describe("org query layer", () => {
  it("every org key sits under orgKeys.all, and the dashboard prefix reaches every period", () => {
    for (const key of [orgKeys.mine, orgKeys.dashboard("o1", "30d"), orgKeys.memberships("u1")]) {
      expect(key.slice(0, 1)).toEqual([...orgKeys.all])
    }
    expect(orgKeys.dashboard("o1", "30d").slice(0, 3)).toEqual([...orgKeys.dashboardOf("o1")])
  })

  it("a membership change refreshes the person's memberships and the admin org list", () => {
    expect(orgEffects["org.membership.change"]({ userId: "u1" })).toEqual([orgKeys.memberships("u1"), orgKeys.mine])
  })

  it("an admin member change refreshes every period of that org's dashboard", () => {
    expect(orgEffects["org.member.change"]({ orgId: "o1" })).toEqual([orgKeys.dashboardOf("o1")])
  })
})

describe("useMyMemberships", () => {
  it("does not fetch without a user", () => {
    const { wrapper } = setup()
    const fetchMock = mockFetch(() => ({ status: 200, body: { data: [] } }))
    const { result } = renderHook(() => useMyMemberships(undefined), { wrapper })
    expect(result.current.fetchStatus).toBe("idle")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("returns the memberships and drops those whose organization the RLS hid", async () => {
    const { wrapper } = setup()
    mockFetch(() => ({ status: 200, body: { data: [membership(), membership({ organization_id: "x", organizations: null })] } }))
    const { result } = renderHook(() => useMyMemberships("u1"), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].organizations.slug).toBe("giral")
  })

  it("keeps each user's cache apart", async () => {
    const { qc, wrapper } = setup()
    mockFetch(() => ({ status: 200, body: { data: [membership()] } }))
    const { result } = renderHook(() => useMyMemberships("u1"), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(qc.getQueryData(orgKeys.memberships("u1"))).toBeDefined()
    expect(qc.getQueryData(orgKeys.memberships("u2"))).toBeUndefined()
  })

  it("a response outside the contract is an error", async () => {
    const { wrapper } = setup()
    mockFetch(() => ({ status: 200, body: { data: [{ nope: true }] } }))
    const { result } = renderHook(() => useMyMemberships("u1"), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe("useJoinOrganization", () => {
  it("posts the slug, returns state and message, and refreshes the memberships", async () => {
    const { qc, wrapper } = setup()
    const invalidate = jest.spyOn(qc, "invalidateQueries")
    const fetchMock = mockFetch(() => ({ status: 200, body: { data: { status: "requested" }, message: "Solicitação enviada" } }))
    const { result } = renderHook(() => useJoinOrganization("u1"), { wrapper })

    let response: Awaited<ReturnType<typeof result.current.mutateAsync>> | undefined
    await act(async () => {
      response = await result.current.mutateAsync("giral")
    })

    expect(response).toEqual({ data: { status: "requested" }, message: "Solicitação enviada" })
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/me/organizations",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ slug: "giral" }) })
    )
    expect(invalidate).toHaveBeenCalledWith({ queryKey: orgKeys.memberships("u1") })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: orgKeys.mine })
  })

  it("an invite-only refusal is an ApiClientError with the server message", async () => {
    const { wrapper } = setup()
    mockFetch(() => ({ status: 403, body: { error: "Esta organização entra apenas por convite.", code: "FORBIDDEN" } }))
    const { result } = renderHook(() => useJoinOrganization("u1"), { wrapper })
    const error = await act(async () => result.current.mutateAsync("giral").catch(e => e))
    expect(error).toBeInstanceOf(ApiClientError)
    expect(error).toMatchObject({ status: 403, message: "Esta organização entra apenas por convite." })
  })
})

describe("useLeaveOrganization", () => {
  it("sends DELETE with the organization id and refreshes the memberships", async () => {
    const { qc, wrapper } = setup()
    const invalidate = jest.spyOn(qc, "invalidateQueries")
    const fetchMock = mockFetch(() => ({ status: 200, body: { data: { organizationId: ORG }, message: "Você saiu da organização" } }))
    const { result } = renderHook(() => useLeaveOrganization("u1"), { wrapper })

    await act(async () => {
      await result.current.mutateAsync(ORG)
    })

    expect(fetchMock).toHaveBeenCalledWith(`/api/me/organizations?organizationId=${ORG}`, { method: "DELETE" })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: orgKeys.memberships("u1") })
  })
})
