import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor, act } from "@testing-library/react"
import { useCommunityProfilesByIds } from "./useCommunityProfilesByIds"

const profile = {
  id: "p1", full_name: "Ana", avatar_url: null, bio: "b", job_title: null, company: null, linkedin_url: null,
  github_url: null, cv_url: null, languages: null, expertise_areas: null, mentorship_topics: null,
  learning_goals: null, slug: null, role: "mentee",
}

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
  return Wrapper
}

describe("useCommunityProfilesByIds", () => {
  it("calls the BFF route with comma-joined ids and returns the profiles", async () => {
    global.fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => ({ profiles: [profile] }) }) as Response) as never
    const { result } = renderHook(() => useCommunityProfilesByIds(), { wrapper: wrapper() })
    let out: unknown
    await act(async () => { out = await result.current.mutateAsync(["a", "b"]) })
    expect(global.fetch).toHaveBeenCalledWith("/api/community/profiles?ids=a%2Cb", undefined)
    expect(out).toEqual([profile])
  })

  it("does not call the network for an empty list", async () => {
    global.fetch = jest.fn() as never
    const { result } = renderHook(() => useCommunityProfilesByIds(), { wrapper: wrapper() })
    await act(async () => { await result.current.mutateAsync([]) })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it("surfaces the route error", async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 401, json: async () => ({ error: "Não autenticado" }) }) as Response) as never
    const { result } = renderHook(() => useCommunityProfilesByIds(), { wrapper: wrapper() })
    await act(async () => { await result.current.mutateAsync(["a"]).catch(() => {}) })
    await waitFor(() => expect(result.current.error?.message).toBe("Não autenticado"))
  })
})