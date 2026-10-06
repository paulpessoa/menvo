import "@testing-library/jest-dom"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AdminAppointmentsManager } from "./AdminAppointmentsManager"

// Consultas por role nos menus/diálogos do Radix são lentas no jsdom (~2s cada interação).
jest.setTimeout(20_000)

const toastMock = jest.fn()
jest.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: toastMock }) }))
// next-intl ships ESM-only builds that Jest doesn't transform; the header only needs a plain link.
jest.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  )
}))

// Radix (menus, dialogs, sheets) usa APIs que o jsdom não implementa.
beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn()
  window.HTMLElement.prototype.setPointerCapture = jest.fn()
  window.HTMLElement.prototype.releasePointerCapture = jest.fn()
  window.HTMLElement.prototype.scrollIntoView = jest.fn()
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any
})

const person = (name: string | null, email: string, nameIncomplete = false) => ({ id: email, name, email, nameIncomplete })

function appointment(overrides: Record<string, any> = {}) {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    status: "pending",
    statusLabel: "Aguardando mentor",
    scheduledAt: "2026-10-07T16:00:00.000Z",
    durationMinutes: 45,
    createdAt: "2026-09-28T12:00:00.000Z",
    updatedAt: "2026-09-28T12:00:00.000Z",
    mentor: person("Bianca Dias", "bianca@example.com"),
    mentee: person("Maria Silva", "maria@example.com"),
    reason: "Quero orientação sobre transição de carreira para dados",
    topic: null,
    mentorNotes: null,
    cancellationReason: null,
    cancelledAt: null,
    cancelledBy: null,
    googleMeetLink: null,
    googleCalendarLink: null,
    hasCalendarEvent: false,
    pendingReminderSentAt: null,
    flags: { awaitingMentor: true, waitingHours: 72, stale: true, sessionPassed: false, tokenExpired: false, missingReason: false },
    actions: { resendMentorRequest: true, resendConfirmation: false, cancel: true },
    ...overrides
  }
}

const COUNTS = { all: 3, pending: 1, confirmed: 1, cancelled: 1 }

function listResponse(appointments: any[], extra: Record<string, any> = {}) {
  return { appointments, counts: COUNTS, total: appointments.length, truncated: false, ...extra }
}

function jsonResponse(body: unknown, ok = true, status = 200) {
  return Promise.resolve({ ok, status, json: async () => body } as Response)
}

describe("AdminAppointmentsManager", () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    toastMock.mockClear()
    fetchMock = jest.fn()
    global.fetch = fetchMock as any
  })

  const urlsCalled = () => fetchMock.mock.calls.map(([url]) => String(url))

  it("lists sessions with people, status, reason and attention flags", async () => {
    fetchMock.mockImplementation(() =>
      jsonResponse(
        listResponse([
          appointment({ mentee: person("Usuário Teste", "usuario.teste@example.com", true) }),
          appointment({
            id: "22222222-2222-4222-8222-222222222222",
            reason: null,
            flags: { awaitingMentor: true, waitingHours: 3, stale: false, sessionPassed: false, tokenExpired: true, missingReason: true }
          })
        ])
      )
    )

    render(<AdminAppointmentsManager />)

    expect(await screen.findAllByText("Bianca Dias")).toHaveLength(2)
    expect(screen.getByText("usuario.teste@example.com")).toBeInTheDocument()
    expect(screen.getByText("Perfil incompleto")).toBeInTheDocument()
    expect(screen.getByText("Sem resposta há 3 dias")).toBeInTheDocument()
    expect(screen.getByText("Link do e-mail expirado")).toBeInTheDocument()
    expect(screen.getByText("Sem motivo informado")).toBeInTheDocument()
    expect(screen.getByText("Quero orientação sobre transição de carreira para dados")).toBeInTheDocument()
    expect(screen.getByTestId("count-all")).toHaveTextContent("3")
    expect(screen.getByTestId("count-pending")).toHaveTextContent("1")
    expect(urlsCalled()[0]).toBe("/api/admin/appointments")
  })

  it("shows an empty state when nothing matches", async () => {
    fetchMock.mockImplementation(() => jsonResponse(listResponse([])))
    render(<AdminAppointmentsManager />)
    expect(await screen.findByText("Nenhuma sessão encontrada com estes filtros.")).toBeInTheDocument()
  })

  it("warns when the list is truncated", async () => {
    fetchMock.mockImplementation(() => jsonResponse(listResponse([appointment()], { truncated: true })))
    render(<AdminAppointmentsManager />)
    expect(await screen.findByText(/Mostrando apenas as sessões mais recentes/)).toBeInTheDocument()
  })

  it("refetches by status when a tab is selected", async () => {
    fetchMock.mockImplementation(() => jsonResponse(listResponse([appointment()])))
    render(<AdminAppointmentsManager />)
    await screen.findAllByText("Bianca Dias")

    await userEvent.setup({ delay: null }).click(screen.getByRole("tab", { name: /Confirmadas/ }))

    await waitFor(() => expect(urlsCalled()).toContain("/api/admin/appointments?status=confirmed"))
  })

  it("debounces the search box and sends q", async () => {
    fetchMock.mockImplementation(() => jsonResponse(listResponse([appointment()])))
    render(<AdminAppointmentsManager />)
    await screen.findAllByText("Bianca Dias")

    await userEvent.setup({ delay: null }).type(screen.getByLabelText("Buscar sessões"), "maria")

    await waitFor(() => expect(urlsCalled()).toContain("/api/admin/appointments?q=maria"))
    // digitar 5 letras não dispara 5 buscas
    expect(urlsCalled().filter(url => url.includes("q="))).toHaveLength(1)
  })

  it("reports a load failure", async () => {
    fetchMock.mockImplementation(() => jsonResponse({ error: "boom" }, false, 500))
    render(<AdminAppointmentsManager />)
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Erro ao carregar as sessões", variant: "destructive" }))
    )
  })

  async function openMenu(user: ReturnType<typeof userEvent.setup>) {
    await screen.findAllByText("Bianca Dias")
    await user.click(screen.getByRole("button", { name: /Ações da sessão de Maria Silva com Bianca Dias/ }))
  }

  it("asks for confirmation, then resends the mentor request", async () => {
    const user = userEvent.setup({ delay: null })
    fetchMock.mockImplementation((url: string, init?: RequestInit) =>
      init?.method === "POST"
        ? jsonResponse({ success: true, sentTo: "bianca@example.com", tokenRenewed: true })
        : jsonResponse(listResponse([appointment()]))
    )
    render(<AdminAppointmentsManager />)

    await openMenu(user)
    await user.click(await screen.findByRole("menuitem", { name: /Reenviar pedido ao mentor/ }))

    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByText(/bianca@example.com/)).toBeInTheDocument()
    // ainda não enviou nada
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === "POST")).toBe(false)

    await user.click(within(dialog).getByRole("button", { name: /Reenviar/ }))

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST")
      expect(post[0]).toBe("/api/admin/appointments/11111111-1111-4111-8111-111111111111/resend")
      expect(JSON.parse(post[1].body)).toEqual({ target: "mentor_request" })
    })
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "E-mail reenviado",
          description: expect.stringContaining("renovado")
        })
      )
    )
  })

  it("shows the server error when a resend is refused", async () => {
    const user = userEvent.setup({ delay: null })
    fetchMock.mockImplementation((url: string, init?: RequestInit) =>
      init?.method === "POST"
        ? jsonResponse({ error: "O horário da sessão já passou." }, false, 409)
        : jsonResponse(listResponse([appointment()]))
    )
    render(<AdminAppointmentsManager />)

    await openMenu(user)
    await user.click(await screen.findByRole("menuitem", { name: /Reenviar pedido ao mentor/ }))
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: /Reenviar/ }))

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith({ title: "O horário da sessão já passou.", variant: "destructive" })
    )
  })

  it("only offers actions that make sense for the status", async () => {
    const user = userEvent.setup({ delay: null })
    fetchMock.mockImplementation(() =>
      jsonResponse(
        listResponse([
          appointment({
            status: "completed",
            statusLabel: "Concluída",
            actions: { resendMentorRequest: false, resendConfirmation: false, cancel: false }
          })
        ])
      )
    )
    render(<AdminAppointmentsManager />)

    await openMenu(user)

    expect(await screen.findByRole("menuitem", { name: /Ver detalhes/ })).toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: /Reenviar/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: /Cancelar sessão/ })).not.toBeInTheDocument()
  })

  it("requires a reason of 10+ characters before cancelling, then cancels and reloads", async () => {
    const user = userEvent.setup({ delay: null })
    fetchMock.mockImplementation((url: string, init?: RequestInit) =>
      init?.method === "POST"
        ? jsonResponse({ success: true, calendarEventRemoved: null, notified: { mentor: true, mentee: true } })
        : jsonResponse(listResponse([appointment()]))
    )
    render(<AdminAppointmentsManager />)

    await openMenu(user)
    await user.click(await screen.findByRole("menuitem", { name: /Cancelar sessão/ }))

    const dialog = await screen.findByRole("dialog")
    const confirm = within(dialog).getByRole("button", { name: "Cancelar sessão" })
    expect(confirm).toBeDisabled()

    await user.type(within(dialog).getByLabelText(/Motivo do cancelamento/), "curto")
    expect(confirm).toBeDisabled()

    await user.type(within(dialog).getByLabelText(/Motivo do cancelamento/), " mas agora é um motivo válido")
    expect(confirm).toBeEnabled()

    const loadsBefore = urlsCalled().filter(url => !url.includes("/cancel")).length
    await user.click(confirm)

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST")
      expect(post[0]).toBe("/api/admin/appointments/11111111-1111-4111-8111-111111111111/cancel")
      expect(JSON.parse(post[1].body)).toEqual({ reason: "curto mas agora é um motivo válido" })
    })
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Sessão cancelada", description: "Mentor e mentorado foram avisados por e-mail." })
      )
    )
    await waitFor(() => expect(urlsCalled().filter(url => !url.includes("/cancel")).length).toBeGreaterThan(loadsBefore))
  })

  it("tells the admin what to check manually when the cancellation only partly worked", async () => {
    const user = userEvent.setup({ delay: null })
    fetchMock.mockImplementation((url: string, init?: RequestInit) =>
      init?.method === "POST"
        ? jsonResponse({ success: true, calendarEventRemoved: false, notified: { mentor: true, mentee: false } })
        : jsonResponse(listResponse([appointment()]))
    )
    render(<AdminAppointmentsManager />)

    await openMenu(user)
    await user.click(await screen.findByRole("menuitem", { name: /Cancelar sessão/ }))
    const dialog = await screen.findByRole("dialog")
    await user.type(within(dialog).getByLabelText(/Motivo do cancelamento/), "Pedido duplicado do mesmo horário")
    await user.click(within(dialog).getByRole("button", { name: "Cancelar sessão" }))

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Sessão cancelada",
          variant: "destructive",
          description: expect.stringMatching(/mentorado não foi avisado.*Google Calendar não foi removido/)
        })
      )
    )
  })

  it("opens the details panel with the full reason and the ID", async () => {
    const user = userEvent.setup({ delay: null })
    const long = "Motivo bem longo ".repeat(12).trim()
    fetchMock.mockImplementation(() => jsonResponse(listResponse([appointment({ reason: long })])))
    render(<AdminAppointmentsManager />)

    await openMenu(user)
    await user.click(await screen.findByRole("menuitem", { name: /Ver detalhes/ }))

    const panel = await screen.findByRole("dialog")
    expect(within(panel).getByText(long)).toBeInTheDocument()
    expect(within(panel).getByText(/ID: 11111111-1111-4111-8111-111111111111/)).toBeInTheDocument()
  })
})
