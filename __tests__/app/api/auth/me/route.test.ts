import { GET } from "@/app/api/auth/me/route"
import { createClient } from "@/utils/supabase/server"
import { NextRequest } from "next/server"
import jest from "jest" // Declaring the jest variable

// Mock do Supabase server client
jest.mock("@/utils/supabase/server")
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe("/api/auth/me", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return user and profile data when authenticated", async () => {
    const mockUser = {
      id: "123",
      email: "test@example.com",
      email_confirmed_at: "2024-01-01T00:00:00Z",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    }

    const mockProfile = {
      id: "123",
      email: "test@example.com",
      first_name: "John",
      last_name: "Doe",
      role: "mentee",
    }

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      }),
    }

    mockCreateClient.mockReturnValue(mockSupabase as any)

    const request = new NextRequest("http://localhost:3000/api/auth/me")
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user).toEqual(mockUser)
    expect(data.profile).toEqual(mockProfile)
  })

  it("should return 401 when not authenticated", async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "Not authenticated" },
        }),
      },
    }

    mockCreateClient.mockReturnValue(mockSupabase as any)

    const request = new NextRequest("http://localhost:3000/api/auth/me")
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe("Não autenticado")
  })

  it("should return 500 when profile fetch fails", async () => {
    const mockUser = { id: "123", email: "test@example.com" }

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Profile not found" },
            }),
          }),
        }),
      }),
    }

    mockCreateClient.mockReturnValue(mockSupabase as any)

    const request = new NextRequest("http://localhost:3000/api/auth/me")
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe("Erro ao buscar perfil")
  })
})
