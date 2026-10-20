import "@testing-library/jest-dom"
import { render as rtlRender, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactElement } from "react"
import { MentorPauseToggle } from "./MentorPauseToggle"
import { MentorPausedBanner } from "./MentorPausedBanner"

const mockRefreshProfile = jest.fn()

/** O hook de salvar o perfil usa TanStack Query: precisa do provider. */
const render = (ui: ReactElement) =>
  rtlRender(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>{ui}</QueryClientProvider>
  )

jest.mock("@/lib/auth", () => ({
  useAuth: () => ({
    refreshProfile: mockRefreshProfile,
  }),
}))

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe("MentorPauseToggle", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  it("renders 'Pausar mentorias' button when mentor is currently public", () => {
    render(<MentorPauseToggle isPublic={true} />)
    expect(screen.getByRole("button", { name: /pausar mentorias/i })).toBeInTheDocument()
  })

  it("renders 'Aparecer no catálogo' button when the profile is out of the catalog", () => {
    render(<MentorPauseToggle isPublic={false} />)
    expect(screen.getByRole("button", { name: /aparecer no catálogo/i })).toBeInTheDocument()
  })

  it("reactivates mentorship on click when paused", async () => {
    const user = userEvent.setup({ delay: null })
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(<MentorPauseToggle isPublic={false} />)

    await user.click(screen.getByRole("button", { name: /aparecer no catálogo/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/profile",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ is_public: true }),
        })
      )
      expect(mockRefreshProfile).toHaveBeenCalled()
    })
  })
})

describe("MentorPausedBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  it("does not render when mentor is active/public", () => {
    const { container } = render(<MentorPausedBanner isPublic={true} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("renders warning banner and allows reactivation when paused", async () => {
    const user = userEvent.setup({ delay: null })
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(<MentorPausedBanner isPublic={false} />)

    expect(screen.getByText(/seu perfil não aparece no catálogo/i)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /aparecer no catálogo/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/profile",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ is_public: true }),
        })
      )
      expect(mockRefreshProfile).toHaveBeenCalled()
    })
  })
})
