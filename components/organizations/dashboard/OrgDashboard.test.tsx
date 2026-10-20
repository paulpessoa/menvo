import React from "react"
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { OrgDashboard } from "./OrgDashboard"

const toastSuccess = jest.fn()
const toastError = jest.fn()
jest.mock("sonner", () => ({ toast: { success: (m: string) => toastSuccess(m), error: (m: string) => toastError(m) } }))
jest.mock("@/components/ui/menvo-loader", () => ({ MenvoDots: () => <span>loading</span> }))
jest.mock("@/components/layout/PageContainer", () => ({ PageContainer: ({ children }: { children: ReactNode }) => <div>{children}</div> }))

const ORG = "33333333-3333-4333-8333-333333333333"
const U = (n: number) => `44444444-4444-4444-8444-00000000000${n}`

const member = (n: number, over: object = {}) => ({
  userId: U(n),
  role: "member",
  status: "active",
  platformRole: "mentee",
  joinedAt: "2026-01-01",
  fullName: `Pessoa ${n}`,
  email: `p${n}@x.org`,
  sessionsBooked: 0,
  sessionsGiven: 0,
  quizDone: false,
  ...over,
})

const impact = { period: "all", totalSessionsCompleted: 3, totalHoursCompleted: 2.5, totalDiagnosticsDone: 1, averageRating: 4.5 }
const dashboard = (members: object[], joinPolicy = "open") => ({
  organization: { id: ORG, slug: "giral", name: "Giral", join_policy: joinPolicy },
  members,
  summary: {
    beneficiaries: 1, mentors: 1, pendingRequests: 1, pendingInvites: 0,
    sessionsBookedByBeneficiaries: 2, sessionsGivenByOrgMentors: 1, impact,
  },
})

type Handler = (url: string, init?: RequestInit) => { status: number; body: unknown } | undefined
function mockApi(opts: { mine?: unknown[]; dashboard?: unknown; extra?: Handler }) {
  const fetchMock = jest.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const u = String(url)
    const extra = opts.extra?.(u, init)
    const r =
      extra ??
      (u === "/api/org/mine"
        ? { status: 200, body: { data: opts.mine ?? [{ id: ORG, slug: "giral", name: "Giral" }] } }
        : { status: 200, body: { data: opts.dashboard } })
    return { ok: r.status < 400, status: r.status, json: async () => r.body } as Response
  })
  global.fetch = fetchMock as never
  return fetchMock
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><OrgDashboard /></QueryClientProvider>)
}

const members = () => [
  member(1, { role: "admin", fullName: "Admin Org" }),
  member(2, { platformRole: "mentor", fullName: "Mentora", sessionsGiven: 4 }),
  member(3, { status: "requested", fullName: "Quer Entrar", email: "q@x.org" }),
  member(4, { status: "invited", fullName: "Convidado Beneficiario" }),
]

beforeEach(() => jest.clearAllMocks())

describe("OrgDashboard", () => {
  it("says so when the person administers no organization", async () => {
    mockApi({ mine: [] })
    renderPage()
    expect(await screen.findByText("Você não administra nenhuma organização parceira.")).toBeInTheDocument()
  })

  it("shows the org, the impact numbers and the lists split by platform role", async () => {
    mockApi({ dashboard: dashboard(members()) })
    renderPage()
    expect(await screen.findByRole("heading", { name: "Giral" })).toBeInTheDocument()
    expect(screen.getByText("2.5h")).toBeInTheDocument()
    expect(screen.getByText("4.5 ★")).toBeInTheDocument()
    expect(screen.getByText("Beneficiários (1)")).toBeInTheDocument()
    expect(screen.getByText("Mentores da organização (1)")).toBeInTheDocument()
    expect(screen.getByText("Solicitações pendentes (1)")).toBeInTheDocument()
    expect(screen.getByText("Quer Entrar")).toBeInTheDocument()
  })

  it("changing the period asks the server for that period and keeps the numbers meanwhile", async () => {
    const fetchMock = mockApi({ dashboard: dashboard(members()) })
    renderPage()
    await screen.findByRole("heading", { name: "Giral" })
    fireEvent.click(screen.getByText("90 dias"))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(`/api/org/${ORG}?period=90d`, undefined))
    expect(screen.getByText("2.5h")).toBeInTheDocument()
  })

  it("inviting posts the e-mail, toasts the server message, clears the field and reloads", async () => {
    const fetchMock = mockApi({
      dashboard: dashboard(members()),
      extra: (url, init) =>
        init?.method === "POST" && url.endsWith("/members")
          ? { status: 200, body: { data: { status: "invited" }, message: "Convite enviado" } }
          : undefined,
    })
    renderPage()
    const input = await screen.findByLabelText("E-mail")
    fireEvent.change(input, { target: { value: "nova@x.org" } })
    fireEvent.click(screen.getByRole("button", { name: "Convidar" }))

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Convite enviado"))
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/org/${ORG}/members`,
      expect.objectContaining({ method: "POST", body: JSON.stringify({ email: "nova@x.org" }) })
    )
    await waitFor(() => expect(input).toHaveValue(""))
    const dashboardCalls = fetchMock.mock.calls.filter(([u]) => String(u).startsWith(`/api/org/${ORG}?`))
    expect(dashboardCalls.length).toBeGreaterThanOrEqual(2)
  })

  it("keeps the field and toasts the error when the invite fails", async () => {
    mockApi({
      dashboard: dashboard(members()),
      extra: (_u, init) => (init?.method === "POST" ? { status: 404, body: { error: "Essa pessoa ainda não tem conta na Menvo." } } : undefined),
    })
    renderPage()
    const input = await screen.findByLabelText("E-mail")
    fireEvent.change(input, { target: { value: "x@x.org" } })
    fireEvent.click(screen.getByRole("button", { name: "Convidar" }))
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Essa pessoa ainda não tem conta na Menvo."))
    expect(input).toHaveValue("x@x.org")
  })

  it("approving a request PATCHes the user id", async () => {
    const fetchMock = mockApi({
      dashboard: dashboard(members()),
      extra: (_u, init) =>
        init?.method === "PATCH" ? { status: 200, body: { data: { status: "active" }, message: "Participação aprovada" } } : undefined,
    })
    renderPage()
    fireEvent.click(await screen.findByLabelText("Aprovar"))
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Participação aprovada"))
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/org/${ORG}/members`,
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ userId: U(3) }) })
    )
  })

  it("rejecting a request and cancelling an invite DELETE with their own messages", async () => {
    const fetchMock = mockApi({
      dashboard: dashboard(members()),
      extra: (_u, init) => (init?.method === "DELETE" ? { status: 200, body: { data: { userId: "x" } } } : undefined),
    })
    renderPage()
    fireEvent.click(await screen.findByLabelText("Recusar"))
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Solicitação recusada"))
    expect(fetchMock).toHaveBeenCalledWith(`/api/org/${ORG}/members?userId=${U(3)}`, { method: "DELETE" })

    const beneficiaries = screen.getByText("Beneficiários (1)").closest("div[class*='rounded']") as HTMLElement
    fireEvent.click(within(beneficiaries.parentElement as HTMLElement).getAllByLabelText("Remover")[0])
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Convite cancelado"))
  })

  it("switching to invite-only PATCHes the policy and says so", async () => {
    const fetchMock = mockApi({
      dashboard: dashboard(members()),
      extra: (_u, init) => (init?.method === "PATCH" ? { status: 200, body: { data: { id: ORG, slug: "giral", name: "Giral", join_policy: "invite_only" } } } : undefined),
    })
    renderPage()
    fireEvent.click(await screen.findByRole("switch"))
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Página pública: somente por convite"))
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/org/${ORG}`,
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ join_policy: "invite_only" }) })
    )
  })

  it("an invite-only org shows the switch off and its explanation", async () => {
    mockApi({ dashboard: dashboard(members(), "invite_only") })
    renderPage()
    expect(await screen.findByText(/Somente por convite: a página existe/)).toBeInTheDocument()
    expect(screen.getByRole("switch")).not.toBeChecked()
  })

  it("toasts when the dashboard cannot be loaded and still shows the page shell", async () => {
    mockApi({ extra: url => (url.startsWith(`/api/org/${ORG}?`) ? { status: 500, body: { error: "Falha ao carregar" } } : undefined) })
    renderPage()
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Falha ao carregar"))
    expect(await screen.findByText("Minha Organização")).toBeInTheDocument()
  })
})
