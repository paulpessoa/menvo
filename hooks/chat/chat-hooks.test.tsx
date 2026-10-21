import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { chatKeys } from "@/lib/query/keys/chat"
import { useChatConversations } from "./useChatConversations"
import { useUnreadCount } from "./useUnreadCount"

let mockUser: { id: string } | null = { id: "u1" }
jest.mock("@/lib/auth", () => ({
  useAuth: () => ({ user: mockUser, isAuthenticated: !!mockUser }),
}))

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  return { qc, wrapper }
}

function mockFetch(status: number, body: unknown) {
  global.fetch = jest.fn(async () => ({ ok: status < 400, status, json: async () => body }) as Response) as never
  return global.fetch as jest.Mock
}

const conversation = {
  id: "c1",
  mentor_id: "m1",
  mentee_id: "u1",
  last_message_at: null,
  created_at: "2026-01-01T00:00:00Z",
  unread_count: 2,
  other_user: { id: "m1", full_name: "Ana", avatar_url: null, role_name: "mentor" },
}

beforeEach(() => {
  mockUser = { id: "u1" }
})

describe("useChatConversations", () => {
  it("loads the list under the user's key", async () => {
    const { qc, wrapper } = setup()
    const fetchMock = mockFetch(200, { conversations: [conversation] })
    const { result } = renderHook(() => useChatConversations(), { wrapper })
    await waitFor(() => expect(result.current.data).toEqual([conversation]))
    expect(fetchMock).toHaveBeenCalledWith("/api/chat/conversations", undefined)
    expect(qc.getQueryData(chatKeys.conversations("u1"))).toEqual([conversation])
  })

  it("does not fetch without a session", () => {
    mockUser = null
    const { wrapper } = setup()
    const fetchMock = mockFetch(200, { conversations: [] })
    renderHook(() => useChatConversations(), { wrapper })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe("useUnreadCount", () => {
  it("returns the server count", async () => {
    const { wrapper } = setup()
    mockFetch(200, { count: 4 })
    const { result } = renderHook(() => useUnreadCount(), { wrapper })
    await waitFor(() => expect(result.current).toBe(4))
  })

  it("is 0 while loading or when the request fails", async () => {
    const { wrapper } = setup()
    mockFetch(500, { error: "x" })
    const { result } = renderHook(() => useUnreadCount(), { wrapper })
    expect(result.current).toBe(0)
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    expect(result.current).toBe(0)
  })
})
