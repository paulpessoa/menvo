import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor, act } from "@testing-library/react"
import { qk } from "@/lib/query/keys"
import { QUIZ_DRAFT_KEY, QUIZ_DRAFT_VERSION } from "@/lib/quiz/draft"
import { writeDraft } from "@/hooks/usePersistentDraft"
import { useSubmitQuiz } from "./useSubmitQuiz"
import { useQuizResult } from "./useQuizResult"
import { useLatestQuiz } from "./useLatestQuiz"
import { useAccountLink } from "./useAccountLink"

jest.mock("@/app/actions/mentors", () => ({ resolveMentorSlugsAction: jest.fn() }))

const ID = "33333333-3333-3333-3333-333333333333"

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
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

const unprocessed = { id: ID, processed_at: null, ai_analysis: null, is_owner: false }
const analysis = {
  titulo_personalizado: "t",
  resumo_motivador: "r",
  mentores_sugeridos: [],
  conselhos_praticos: [],
  proximos_passos: [],
  areas_desenvolvimento: [],
  mensagem_final: "m",
}

beforeEach(() => window.localStorage.clear())

describe("useSubmitQuiz", () => {
  const input = {
    name: "Ana Silva",
    email: "ana@example.com",
    career_moment: "x",
    mentorship_experience: "y",
    development_areas: ["dados"],
    current_challenge: "Preciso do primeiro estágio.",
    future_vision: "Quero ser desenvolvedora.",
    share_knowledge: "sim",
    personal_life_help: "Equilibrar estudo e trabalho.",
  }

  it("on success: clears the draft and invalidates everything under quiz", async () => {
    const { qc, wrapper } = setup()
    writeDraft(QUIZ_DRAFT_KEY, QUIZ_DRAFT_VERSION, { currentStep: 3, answers: {} })
    const invalidate = jest.spyOn(qc, "invalidateQueries")
    mockFetch(() => ({ status: 200, body: { id: ID } }))

    const { result } = renderHook(() => useSubmitQuiz(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync(input)
    })

    expect(window.localStorage.getItem(QUIZ_DRAFT_KEY)).toBeNull()
    expect(invalidate).toHaveBeenCalledWith({ queryKey: qk.quiz.all })
  })

  it("on a limit error: keeps the draft and exposes the server code", async () => {
    const { wrapper } = setup()
    writeDraft(QUIZ_DRAFT_KEY, QUIZ_DRAFT_VERSION, { currentStep: 3, answers: {} })
    mockFetch(() => ({ status: 429, body: { error: "Você já fez 1 análise", code: "email_limit" } }))

    const { result } = renderHook(() => useSubmitQuiz(), { wrapper })
    const error = await act(async () => result.current.mutateAsync(input).catch((e) => e))

    expect(error).toMatchObject({ status: 429, code: "email_limit" })
    expect(window.localStorage.getItem(QUIZ_DRAFT_KEY)).not.toBeNull()
  })
})

describe("useQuizResult", () => {
  it("returns a processed result with no analysis request", async () => {
    const { wrapper } = setup()
    const fetchMock = mockFetch(() => ({ status: 200, body: { ...unprocessed, processed_at: "2026-10-01", ai_analysis: analysis } }))

    const { result } = renderHook(() => useQuizResult(ID), { wrapper })
    await waitFor(() => expect(result.current.data?.processed_at).toBe("2026-10-01"))

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("asks for the analysis again every 35 unprocessed polls, never before", async () => {
    const { wrapper } = setup()
    const fetchMock = mockFetch((url) => (url.endsWith("/analyze") ? { status: 200, body: { ok: true, claimed: false } } : { status: 200, body: unprocessed }))

    const { result } = renderHook(() => useQuizResult(ID), { wrapper })
    await waitFor(() => expect(result.current.data).toBeDefined()) // attempt 0
    const analyzeCalls = () => fetchMock.mock.calls.filter(([u]) => String(u).endsWith("/analyze")).length

    for (let i = 1; i <= 34; i++) await act(async () => void (await result.current.refetch()))
    expect(analyzeCalls()).toBe(0)

    await act(async () => void (await result.current.refetch())) // attempt 35
    expect(analyzeCalls()).toBe(1)
    expect(fetchMock).toHaveBeenCalledWith(`/api/quiz/${ID}/analyze`, expect.objectContaining({ method: "POST" }))
  })

  it("fails after ~4 minutes without a result instead of spinning forever", async () => {
    const { wrapper } = setup()
    mockFetch((url) => (url.endsWith("/analyze") ? { status: 200, body: { ok: true, claimed: false } } : { status: 200, body: unprocessed }))

    const { result } = renderHook(() => useQuizResult(ID), { wrapper })
    await waitFor(() => expect(result.current.data).toBeDefined())
    for (let i = 1; i <= 119; i++) await act(async () => void (await result.current.refetch()))
    expect(result.current.isError).toBe(false)

    await act(async () => void (await result.current.refetch())) // the 120th poll gives up
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it("not found is an error right away (no retry loop)", async () => {
    const { wrapper } = setup()
    mockFetch(() => ({ status: 404, body: { error: "Resultado não encontrado" } }))

    const { result } = renderHook(() => useQuizResult(ID), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it("does nothing without an id", () => {
    const { wrapper } = setup()
    const fetchMock = mockFetch(() => ({ status: 200, body: {} }))
    renderHook(() => useQuizResult(undefined), { wrapper })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe("useLatestQuiz", () => {
  it("is idle until there is a user, then returns the summary", async () => {
    const { wrapper } = setup()
    const fetchMock = mockFetch(() => ({ status: 200, body: { summary: null } }))

    const { result, rerender } = renderHook(({ id }: { id?: string }) => useLatestQuiz(id), { wrapper, initialProps: {} as { id?: string } })
    expect(fetchMock).not.toHaveBeenCalled()

    rerender({ id: "u1" })
    await waitFor(() => expect(result.current.data).toBeNull())
    expect(fetchMock).toHaveBeenCalledWith("/api/quiz/latest", undefined)
  })

  it("a failure resolves to null so the dashboard offers the quiz instead of an error", async () => {
    const { wrapper } = setup()
    jest.spyOn(console, "error").mockImplementation(() => {})
    mockFetch(() => ({ status: 500, body: { error: "x" } }))

    const { result } = renderHook(() => useLatestQuiz("u1"), { wrapper })
    await waitFor(() => expect(result.current.data).toBeNull())
    expect(result.current.isError).toBe(false)
    jest.restoreAllMocks()
  })
})

describe("useAccountLink", () => {
  it("sends the token in the request but keeps it out of the cache key", async () => {
    const { qc, wrapper } = setup()
    const fetchMock = mockFetch(() => ({ status: 200, body: { status: "claimable", email: "a@b.co" } }))

    const { result } = renderHook(() => useAccountLink(ID, "secret.token"), { wrapper })
    await waitFor(() => expect(result.current.data).toEqual({ status: "claimable", email: "a@b.co" }))

    expect(String(fetchMock.mock.calls[0][0])).toContain("k=secret.token")
    expect(JSON.stringify(qc.getQueryCache().getAll().map((q) => q.queryKey))).not.toContain("secret")
  })

  it("an invalid or expired link resolves to null (the banner stays hidden)", async () => {
    const { wrapper } = setup()
    mockFetch(() => ({ status: 403, body: { error: "Link inválido ou expirado" } }))

    const { result } = renderHook(() => useAccountLink(ID, "bad"), { wrapper })
    await waitFor(() => expect(result.current.data).toBeNull())
  })
})
