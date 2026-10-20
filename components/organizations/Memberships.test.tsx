import React from "react"
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { OrganizationsTab } from "@/components/profile/OrganizationsTab"
import { JoinOrganizationButton } from "./JoinOrganizationButton"

const push = jest.fn()
const toastSuccess = jest.fn()
const toastError = jest.fn()

jest.mock("@/i18n/routing", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
  useRouter: () => ({ push }),
}))
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: { name?: string }) => (values?.name ? `${key}:${values.name}` : key),
}))
jest.mock("sonner", () => ({ toast: { success: (m: string) => toastSuccess(m), error: (m: string) => toastError(m) } }))
jest.mock("@/components/ui/menvo-loader", () => ({ MenvoDots: () => <span>loading</span> }))
const mockAuth = { user: { id: "u1" } as { id: string } | null, loading: false, cachedRoles: { mentor: false } }
jest.mock("@/lib/auth", () => ({ useAuth: () => mockAuth }))

const ORG = "33333333-3333-4333-8333-333333333333"
const membership = (status: string, over: object = {}) => ({
  organization_id: ORG,
  role: "member",
  status,
  created_at: "2026-01-01",
  organizations: { id: ORG, slug: "giral", name: "Giral", type: "ngo", status: "active" },
  ...over,
})

function mockApi(rows: unknown[], post?: { status: number; body: unknown }) {
  global.fetch = jest.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method === "POST") {
      const r = post ?? { status: 200, body: { data: { status: "active" }, message: "Você agora faz parte da Giral" } }
      return { ok: r.status < 400, status: r.status, json: async () => r.body } as Response
    }
    if (init?.method === "DELETE") return { ok: true, status: 200, json: async () => ({ data: { organizationId: ORG } }) } as Response
    return { ok: true, status: 200, json: async () => ({ data: rows }) } as Response
  }) as never
  return global.fetch as jest.Mock
}

function renderWithClient(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.user = { id: "u1" }
  mockAuth.loading = false
})

describe("JoinOrganizationButton", () => {
  const button = (joinPolicy: "open" | "invite_only" = "open") => (
    <JoinOrganizationButton slug="giral" orgName="Giral" joinPolicy={joinPolicy} />
  )

  it("shows login links when there is no session, without calling the API", () => {
    mockAuth.user = null
    const fetchMock = mockApi([])
    renderWithClient(button())
    expect(screen.getByText("joinToParticipate")).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("asks to join an open org and navigates when the answer is active", async () => {
    mockApi([])
    renderWithClient(button())
    fireEvent.click(await screen.findByText("requestToJoin"))
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"))
    expect(toastSuccess).toHaveBeenCalledWith("Você agora faz parte da Giral")
  })

  it("shows the invite-only message instead of a request button", async () => {
    mockApi([])
    renderWithClient(button("invite_only"))
    expect(await screen.findByText("inviteOnlyMsg:Giral")).toBeInTheDocument()
    expect(screen.queryByText("requestToJoin")).not.toBeInTheDocument()
  })

  it("an invited person on an invite-only org can accept", async () => {
    mockApi([membership("invited")])
    renderWithClient(button("invite_only"))
    expect(await screen.findByText("Aceitar convite")).toBeInTheDocument()
  })

  it("shows the pending status after a request", async () => {
    mockApi([membership("requested")])
    renderWithClient(button())
    expect(await screen.findByText("requestedStatus")).toBeInTheDocument()
  })

  it("toasts the server message when the request is refused", async () => {
    mockApi([], { status: 403, body: { error: "Esta organização entra apenas por convite.", code: "FORBIDDEN" } })
    renderWithClient(button())
    fireEvent.click(await screen.findByText("requestToJoin"))
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Esta organização entra apenas por convite."))
    expect(push).not.toHaveBeenCalled()
  })
})

describe("OrganizationsTab", () => {
  it("lists invites, active memberships and requests apart", async () => {
    mockApi([
      membership("invited", { organization_id: "i", organizations: { id: "i", slug: "a", name: "Org Convite", type: "ngo", status: "active" } }),
      membership("active"),
      membership("requested", { organization_id: "r", organizations: { id: "r", slug: "b", name: "Org Pedido", type: "ngo", status: "active" } }),
    ])
    renderWithClient(<OrganizationsTab />)
    expect(await screen.findByText("Convites pendentes")).toBeInTheDocument()
    expect(screen.getByText("Org Convite")).toBeInTheDocument()
    expect(screen.getByText("Giral")).toBeInTheDocument()
    expect(screen.getByText("Beneficiário")).toBeInTheDocument()
    expect(screen.getByText("Aguardando aprovação")).toBeInTheDocument()
  })

  it("accepting an invite posts the slug and toasts the server message", async () => {
    const fetchMock = mockApi([membership("invited")])
    renderWithClient(<OrganizationsTab />)
    fireEvent.click(await screen.findByText("Aceitar"))
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Você agora faz parte da Giral"))
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/me/organizations",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ slug: "giral" }) })
    )
  })

  it("declining an invite deletes the membership and says so", async () => {
    const fetchMock = mockApi([membership("invited")])
    renderWithClient(<OrganizationsTab />)
    fireEvent.click(await screen.findByText("Recusar"))
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Convite recusado"))
    expect(fetchMock).toHaveBeenCalledWith(`/api/me/organizations?organizationId=${ORG}`, { method: "DELETE" })
  })

  it("leaving an active org and cancelling a request use their own messages", async () => {
    mockApi([membership("active")])
    renderWithClient(<OrganizationsTab />)
    fireEvent.click(await screen.findByText("Sair"))
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Você saiu da organização"))
  })

  it("shows the empty state when the person has no organization", async () => {
    mockApi([])
    renderWithClient(<OrganizationsTab />)
    expect(await screen.findByText(/ainda não participa de nenhuma organização/)).toBeInTheDocument()
  })

  it("toasts when the list cannot be loaded", async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 500, json: async () => ({ error: "Falha ao carregar" }) }) as Response) as never
    renderWithClient(<OrganizationsTab />)
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Falha ao carregar"))
  })
})
