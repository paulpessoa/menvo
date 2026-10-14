import "@testing-library/jest-dom"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MentorPauseToggle } from "./MentorPauseToggle"
import { MentorPausedBanner } from "./MentorPausedBanner"

const mockRefreshProfile = jest.fn()

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

  it("renders 'Reativar mentorias' button when mentor is currently paused", () => {
    render(<MentorPauseToggle isPublic={false} />)
    expect(screen.getByRole("button", { name: /reativar mentorias/i })).toBeInTheDocument()
  })

  it("reactivates mentorship on click when paused", async () => {
    const user = userEvent.setup({ delay: null })
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(<MentorPauseToggle isPublic={false} />)

    await user.click(screen.getByRole("button", { name: /reativar mentorias/i }))

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

    expect(screen.getByText(/suas mentorias estão temporariamente pausadas/i)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /reativar mentorias/i }))

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
