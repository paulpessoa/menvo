import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { useMentor } from "./useMentor"
import { useMentorsByIds } from "./useMentorsByIds"

const A = "11111111-1111-4111-8111-111111111111"
const mentor = {
  id: A,
  slug: "ana",
  full_name: "Ana",
  first_name: "Ana",
  last_name: "S",
  avatar_url: null,
  job_title: null,
  company: null,
  average_rating: null,
}

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  return { wrapper }
}

function mockFetch(status: number, body: unknown) {
  global.fetch = jest.fn(async () => ({ ok: status < 400, status, json: async () => body }) as Response) as never
  return global.fetch as jest.Mock
}

describe("useMentorsByIds", () => {
  it("drops ids that are not UUIDs before calling the API", async () => {
    const fetchMock = mockFetch(200, { mentors: [mentor] })
    const { result } = renderHook(() => useMentorsByIds([A, "nayane_prudencio", A]), { wrapper: setup().wrapper })
    await waitFor(() => expect(result.current.data).toEqual([mentor]))
    expect(fetchMock).toHaveBeenCalledWith(`/api/mentors?ids=${A}`, undefined)
  })

  it("does not fetch when there is no valid id", () => {
    const fetchMock = mockFetch(200, { mentors: [] })
    renderHook(() => useMentorsByIds(["nope"]), { wrapper: setup().wrapper })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe("useMentor", () => {
  it("returns the mentor", async () => {
    mockFetch(200, { mentor })
    const { result } = renderHook(() => useMentor("ana"), { wrapper: setup().wrapper })
    await waitFor(() => expect(result.current.data).toEqual(mentor))
  })

  it("resolves a 404 to null", async () => {
    mockFetch(404, { error: "Mentor não encontrado" })
    const { result } = renderHook(() => useMentor("ghost"), { wrapper: setup().wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })

  it("surfaces other failures as an error", async () => {
    mockFetch(500, { error: "x" })
    const { result } = renderHook(() => useMentor("ana"), { wrapper: setup().wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
