import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TermsGate } from "./TermsGate"
import { useAuth } from "@/lib/auth"
import { usePathname } from "@/i18n/routing"

jest.mock("@/lib/auth", () => ({ useAuth: jest.fn() }))
jest.mock("@/i18n/routing", () => ({
  usePathname: jest.fn(),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}))
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}))

function renderGate() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <TermsGate />
    </QueryClientProvider>,
  )
}

function mockFetch(accepted: boolean) {
  const fetchMock = jest.fn().mockImplementation((_url: string, init?: { method?: string }) =>
    Promise.resolve(
      init?.method === "POST"
        ? { ok: true, json: async () => ({ ok: true }) }
        : { ok: true, json: async () => ({ accepted }) },
    ),
  )
  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

describe("TermsGate", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({ user: { id: "u1" } })
    ;(usePathname as jest.Mock).mockReturnValue("/dashboard")
  })

  it("stays closed for signed-out visitors and never calls the API", () => {
    ;(useAuth as jest.Mock).mockReturnValue({ user: null })
    const fetchMock = mockFetch(false)

    renderGate()

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("stays closed when the user already accepted the current terms", async () => {
    const fetchMock = mockFetch(true)

    renderGate()

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("stays closed on the legal pages so people can read the terms", () => {
    ;(usePathname as jest.Mock).mockReturnValue("/terms")
    const fetchMock = mockFetch(false)

    renderGate()

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("fails open when the status check errors", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: false })
    global.fetch = fetchMock as unknown as typeof fetch

    renderGate()

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("opens when not accepted, keeps the button disabled until the box is checked, then records and closes", async () => {
    const fetchMock = mockFetch(false)
    const user = userEvent.setup()

    renderGate()

    const accept = await screen.findByRole("button", { name: "accept" })
    expect(accept).toBeDisabled()

    await user.click(screen.getByRole("checkbox"))
    expect(accept).toBeEnabled()

    await user.click(accept)

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/legal/accept-terms", { method: "POST" }),
    )
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })
})
