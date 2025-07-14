import { AuthService } from "@/lib/auth/auth-service"
import { supabase } from "@/lib/auth/supabase-client"
import jest from "jest" // Declare the jest variable

// Mock do Supabase
jest.mock("@/lib/auth/supabase-client")

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("signUp", () => {
    it("should create user successfully", async () => {
      const mockUser = { id: "123", email: "test@example.com" }
      const mockSession = { access_token: "token" }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      } as any)

      const result = await AuthService.signUp({
        email: "test@example.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
      })

      expect(result.user).toEqual(mockUser)
      expect(result.session).toEqual(mockSession)
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        options: {
          data: {
            first_name: "John",
            last_name: "Doe",
          },
        },
      })
    })

    it("should throw error when signup fails", async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Email already exists" },
      } as any)

      await expect(
        AuthService.signUp({
          email: "test@example.com",
          password: "password123",
          firstName: "John",
          lastName: "Doe",
        }),
      ).rejects.toThrow("Email already exists")
    })
  })

  describe("signIn", () => {
    it("should sign in user successfully", async () => {
      const mockUser = { id: "123", email: "test@example.com" }
      const mockSession = { access_token: "token" }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const result = await AuthService.signIn("test@example.com", "password123")

      expect(result.user).toEqual(mockUser)
      expect(result.session).toEqual(mockSession)
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      })
    })

    it("should throw error when signin fails", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid credentials" },
      } as any)

      await expect(AuthService.signIn("test@example.com", "wrongpassword")).rejects.toThrow("Invalid credentials")
    })
  })

  describe("resetPassword", () => {
    it("should send reset password email successfully", async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      })

      await expect(AuthService.resetPassword("test@example.com")).resolves.not.toThrow()

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith("test@example.com", {
        redirectTo: `${window.location.origin}/reset-password`,
      })
    })
  })

  describe("completeProfile", () => {
    it("should complete profile successfully", async () => {
      const mockUser = { id: "123" }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      } as any)

      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      await expect(
        AuthService.completeProfile({
          firstName: "John",
          lastName: "Doe",
          role: "mentee",
        }),
      ).resolves.not.toThrow()
    })
  })
})
