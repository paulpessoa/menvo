import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor, act } from "@testing-library/react"
import { qk } from "@/lib/query/keys"
import { useFavorites } from "./useFavorites"
import { useNotifications } from "./useNotifications"

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

const MENTOR = "6f1c2a4e-1b2c-4d3e-9f00-0123456789ab"

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

beforeEach(() => window.localStorage.clear())

describe("useFavorites", () => {
  it("caches the list under qk.me.favorites", async () => {
    const { qc, wrapper } = setup()
    mockFetch(() => ({ status: 200, body: { favorites: [MENTOR] } }))
    const { result } = renderHook(() => useFavorites("u1"), { wrapper })

    await waitFor(() => expect(result.current.favorites).toEqual([MENTOR]))
    expect(qc.getQueryData(qk.me.favorites("u1"))).toEqual([MENTOR])
  })

  it("adds a favorite optimistically, posts it, and invalidates through the effects map", async () => {
    const { qc, wrapper } = setup()
    const fetchMock = mockFetch((_url, init) =>
      init?.method === "POST" ? { status: 200, body: { ok: true } } : { status: 200, body: { favorites: [] } }
    )
    const invalidate = jest.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useFavorites("u1"), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.toggleFavorite(MENTOR)
    })

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/me/favorites",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ mentorId: MENTOR, action: "add" }) })
    )
    expect(invalidate).toHaveBeenCalledWith({ queryKey: qk.me.favorites("u1") })
  })

  it("rolls back when the server refuses", async () => {
    const { qc, wrapper } = setup()
    mockFetch((_url, init) =>
      init?.method === "POST"
        ? { status: 500, body: { error: "Não foi possível atualizar os favoritos" } }
        : { status: 200, body: { favorites: [] } }
    )
    const { result } = renderHook(() => useFavorites("u1"), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.toggleFavorite(MENTOR).catch(() => undefined)
    })

    await waitFor(() => expect(qc.getQueryData(qk.me.favorites("u1"))).toEqual([]))
  })
})

describe("useNotifications", () => {
  const notification = {
    id: "booking-confirmed-a1",
    type: "booking_confirmed",
    title: "Mentoria confirmada",
    message: "x",
    timestamp: "2026-10-19T12:00:00.000Z",
    actionUrl: "/mentorship/mentee#upcoming",
  }

  it("caches under qk.me.notifications with the role, and passes the role to the server", async () => {
    const { qc, wrapper } = setup()
    const fetchMock = mockFetch(() => ({ status: 200, body: { notifications: [notification] } }))
    const { result } = renderHook(() => useNotifications("u1", "mentee"), { wrapper })

    await waitFor(() => expect(result.current.notifications).toHaveLength(1))
    expect(fetchMock).toHaveBeenCalledWith("/api/me/notifications?role=mentee")
    expect(qc.getQueryData(qk.me.notifications("u1", "mentee"))).toEqual([notification])
    expect(result.current.unreadCount).toBe(1)
  })

  it("remembers read notifications per user in localStorage", async () => {
    const { wrapper } = setup()
    mockFetch(() => ({ status: 200, body: { notifications: [notification] } }))
    const { result } = renderHook(() => useNotifications("u1", null), { wrapper })
    await waitFor(() => expect(result.current.notifications).toHaveLength(1))

    act(() => result.current.markAsRead(notification.id))

    expect(result.current.unreadCount).toBe(0)
    expect(JSON.parse(window.localStorage.getItem("menvo_read_notifications_u1") ?? "[]")).toEqual([notification.id])
  })
})
