import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { AvailabilityAlertButton } from "./AvailabilityAlertButton"
import { useAuth } from "@/lib/auth"

jest.mock("@/lib/auth", () => ({ useAuth: jest.fn() }))
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: { name?: string }) => {
    const map: Record<string, string> = {
      notifyMe: "Me avise quando abrir horário",
      notifyMeActive: "Aviso ativado",
      notifyMeSuccess: "Aviso cadastrado",
      notifyMeModalTitle: "Receber aviso de horários",
      notifyMeModalDesc: `Informe seu e-mail para receber aviso de ${params?.name}`,
      notifyMeEmailPlaceholder: "seu@email.com",
      notifyMeSubmit: "Ativar aviso",
    }
    return map[key] || key
  },
}))
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() } }))

describe("AvailabilityAlertButton", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  it("renders default state with notifyMe text", () => {
    ;(useAuth as jest.Mock).mockReturnValue({ user: null })
    render(<AvailabilityAlertButton mentorId="m1" mentorName="Ana Silva" />)

    expect(screen.getByText("Me avise quando abrir horário")).toBeInTheDocument()
  })

  it("calls POST immediately when clicked by logged in user", async () => {
    ;(useAuth as jest.Mock).mockReturnValue({ user: { id: "u1", email: "user@example.com" } })
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hasActiveAlert: false }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })

    render(<AvailabilityAlertButton mentorId="m1" mentorName="Ana Silva" />)

    const button = screen.getByRole("button", { name: /me avise quando abrir horário/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/mentors/availability-alerts", expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ mentor_id: "m1" }),
      }))
    })

    await waitFor(() => {
      expect(screen.getByText("Aviso ativado")).toBeInTheDocument()
    })
  })

  it("opens modal for unauthenticated user", async () => {
    ;(useAuth as jest.Mock).mockReturnValue({ user: null })
    render(<AvailabilityAlertButton mentorId="m1" mentorName="Ana Silva" />)

    fireEvent.click(screen.getByRole("button", { name: /me avise quando abrir horário/i }))

    expect(screen.getByText("Receber aviso de horários")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("seu@email.com")).toBeInTheDocument()
  })
})
