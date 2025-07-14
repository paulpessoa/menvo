import { render, screen } from "@testing-library/react"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { useAuth } from "@/lib/auth/AuthContext"
import jest from "jest" // Import jest to declare the variable

// Mock do useAuth
jest.mock("@/lib/auth/AuthContext")
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock do useRouter
const mockPush = jest.fn()
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

describe("AuthGuard", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should show loading when not initialized", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: true,
      initialized: false,
    } as any)

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>,
    )

    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  it("should redirect to login when not authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      initialized: true,
    } as any)

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>,
    )

    expect(mockPush).toHaveBeenCalledWith("/login")
  })

  it("should redirect to welcome when user has pending role", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "123", email: "test@example.com" },
      profile: { role: "pending" },
      loading: false,
      initialized: true,
    } as any)

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>,
    )

    expect(mockPush).toHaveBeenCalledWith("/welcome")
  })

  it("should render children when authenticated with valid role", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "123", email: "test@example.com" },
      profile: { role: "mentee" },
      loading: false,
      initialized: true,
    } as any)

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>,
    )

    expect(screen.getByText("Protected Content")).toBeInTheDocument()
  })

  it("should redirect to unauthorized when role does not match required role", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "123", email: "test@example.com" },
      profile: { role: "mentee" },
      loading: false,
      initialized: true,
    } as any)

    render(
      <AuthGuard requiredRole="admin">
        <div>Admin Content</div>
      </AuthGuard>,
    )

    expect(mockPush).toHaveBeenCalledWith("/unauthorized")
  })
})
