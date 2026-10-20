import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor, act } from "@testing-library/react"
import { qk } from "@/lib/query/keys"
import { useOwnProfile } from "./useOwnProfile"
import { useUpdateProfile } from "./useUpdateProfile"

const mockRefreshProfile = jest.fn()
let mockUser: { id: string } | null = { id: "u1" }

jest.mock("@/lib/auth", () => ({
  useAuth: () => ({ user: mockUser, refreshProfile: mockRefreshProfile }),
}))

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  return { qc, wrapper }
}

function mockFetch(handler: (url: string, init?: RequestInit) => { status: number; body: unknown }) {
  global.fetch = jest.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const { status, body } = handler(String(url), init)
    return { ok: status < 400, status, json: async () => body } as Response
  }) as never
  return global.fetch as jest.Mock
}

const profile = { id: "u1", first_name: "Ana", last_name: "Souza", is_public: true }

beforeEach(() => {
  jest.clearAllMocks()
  mockUser = { id: "u1" }
})

describe("useOwnProfile", () => {
  it("loads GET /api/profile under the user's key", async () => {
    const { qc, wrapper } = setup()
    mockFetch(() => ({ status: 200, body: { profile } }))
    const { result } = renderHook(() => useOwnProfile(), { wrapper })

    await waitFor(() => expect(result.current.profile).toEqual(profile))
    expect(result.current.loading).toBe(false)
    expect(qc.getQueryData(qk.profile.own("u1"))).toEqual(profile)
  })

  it("does not fetch without a session and is not 'loading'", () => {
    mockUser = null
    const { wrapper } = setup()
    const fetchMock = mockFetch(() => ({ status: 200, body: { profile } }))
    const { result } = renderHook(() => useOwnProfile(), { wrapper })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current).toMatchObject({ profile: null, loading: false })
  })

  it("exposes the server message on failure", async () => {
    const { wrapper } = setup()
    mockFetch(() => ({ status: 500, body: { error: "Erro ao buscar perfil" } }))
    const { result } = renderHook(() => useOwnProfile(), { wrapper })
    await waitFor(() => expect(result.current.error).toBe("Erro ao buscar perfil"))
  })
})

describe("useUpdateProfile", () => {
  it("rejects an empty first name before any request", async () => {
    const { wrapper } = setup()
    const fetchMock = mockFetch(() => ({ status: 200, body: { profile } }))
    const { result } = renderHook(() => useUpdateProfile(), { wrapper })

    await act(async () => {
      await expect(result.current.mutateAsync({ first_name: "  " })).rejects.toThrow("Nome é obrigatório")
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("PUTs the updates, stores the saved profile, refreshes the session profile and the catalog", async () => {
    const { qc, wrapper } = setup()
    const saved = { ...profile, is_public: false }
    const fetchMock = mockFetch(() => ({ status: 200, body: { message: "ok", profile: saved } }))
    const invalidate = jest.spyOn(qc, "invalidateQueries")
    qc.setQueryData(qk.profile.own("u1"), profile)
    const { result } = renderHook(() => useUpdateProfile(), { wrapper })

    let returned: unknown
    await act(async () => {
      returned = await result.current.mutateAsync({ is_public: false })
    })

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/profile",
      expect.objectContaining({ method: "PUT", body: JSON.stringify({ is_public: false }) })
    )
    expect(returned).toEqual(saved)
    expect(qc.getQueryData(qk.profile.own("u1"))).toEqual(saved)
    expect(mockRefreshProfile).toHaveBeenCalledTimes(1)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: qk.profile.all })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["mentors"] })
  })

  it("applies the change optimistically and rolls it back when the server refuses", async () => {
    const { qc, wrapper } = setup()
    mockFetch(() => ({ status: 409, body: { error: "Esse endereço de perfil (slug) já está em uso" } }))
    qc.setQueryData(qk.profile.own("u1"), profile)
    const { result } = renderHook(() => useUpdateProfile(), { wrapper })

    await act(async () => {
      await expect(result.current.mutateAsync({ slug: "ana" })).rejects.toThrow("slug")
    })

    expect(qc.getQueryData(qk.profile.own("u1"))).toEqual(profile)
    expect(mockRefreshProfile).not.toHaveBeenCalled()
  })

  it("works when the response has no profile (only the visibility switch needs success)", async () => {
    const { wrapper } = setup()
    mockFetch(() => ({ status: 200, body: { success: true } }))
    const { result } = renderHook(() => useUpdateProfile(), { wrapper })
    await act(async () => {
      expect(await result.current.mutateAsync({ is_public: true })).toBeNull()
    })
    expect(mockRefreshProfile).toHaveBeenCalled()
  })
})
