/**
 * Regression tests for the AI match service:
 * - hallucinated mentor_ids (e.g. a slugified name) must be filtered out
 *   server-side, since one bad id used to break the client's follow-up DB
 *   lookup for every suggested mentor (see getMentorsByIds);
 * - every attempt is returned as a metering record, including a call that
 *   fails on the registry side and the keyword fallback.
 */
import { aiMatchService, type MentorContextItem } from "./match.service"
import { getStructuredModel, AiModelUnavailableError } from "@/lib/ai/models"

jest.mock("@/lib/ai/models", () => ({
  getStructuredModel: jest.fn(),
  AiModelUnavailableError: class AiModelUnavailableError extends Error {}
}))

const mockGetStructuredModel = getStructuredModel as jest.MockedFunction<typeof getStructuredModel>
const fakeSupabase = {} as never

const mentors: MentorContextItem[] = [
  { id: "5ebf2ecb-5dc0-4c06-bd77-0c27831239bc", full_name: "Nayane Prudencio", job_title: "Pedagoga" },
  { id: "0b6b4c43-af6b-48cb-8cf2-22912302eec1", full_name: "Márcia Lima", job_title: "Consultora" }
]

/** Mocks the resolved structured-output model, and has it report one
 * successful `AiCallRecord` through `onCall`, matching how a real model
 * built by `lib/ai/models/factory.ts` behaves. */
function mockModel(result: unknown) {
  mockGetStructuredModel.mockImplementation(async (_supabase, _capability, _schema, opts) => {
    opts.onCall({
      provider: "openai",
      model: "gpt-4o-mini",
      inputTokens: 1200,
      outputTokens: 150,
      cachedInputTokens: 1000,
      latencyMs: 400,
      status: "ok"
    })
    return { invoke: async () => result } as never
  })
}

beforeEach(() => {
  mockGetStructuredModel.mockReset()
})

describe("aiMatchService.findOptimalMentors — hallucinated mentor_id", () => {
  it("drops suggestions whose mentor_id is not a real mentor id", async () => {
    mockModel({
      suggestions: [
        { mentor_id: "5ebf2ecb-5dc0-4c06-bd77-0c27831239bc", reason: "real match" },
        { mentor_id: "marcia_lima", reason: "hallucinated id" }
      ],
      global_justification: "test",
      suggested_topics: ["Educação"],
      no_match: false
    })

    const { result } = await aiMatchService.findOptimalMentors(fakeSupabase, "quero ser professor", mentors)

    expect(result.suggestions).toHaveLength(1)
    expect(result.suggestions[0].mentor_id).toBe("5ebf2ecb-5dc0-4c06-bd77-0c27831239bc")
    expect(result.no_match).toBe(false)
  })

  it("falls back to no_match when every suggestion is hallucinated", async () => {
    mockModel({
      suggestions: [{ mentor_id: "nayane_prudencio", reason: "hallucinated id" }],
      global_justification: "test",
      suggested_topics: ["Educação"],
      no_match: false
    })

    const { result } = await aiMatchService.findOptimalMentors(fakeSupabase, "quero trabalhar com crianças", mentors)

    expect(result.suggestions).toHaveLength(0)
    expect(result.no_match).toBe(true)
  })

  it("keeps a fully valid result untouched", async () => {
    mockModel({
      suggestions: [{ mentor_id: "0b6b4c43-af6b-48cb-8cf2-22912302eec1", reason: "real match" }],
      global_justification: "test",
      suggested_topics: ["Empreendedorismo"],
      no_match: false
    })

    const { result } = await aiMatchService.findOptimalMentors(fakeSupabase, "quero abrir um negócio", mentors)

    expect(result.suggestions).toHaveLength(1)
    expect(result.no_match).toBe(false)
  })
})

describe("aiMatchService.findOptimalMentors — metering and fallback", () => {
  it("reports the model's token usage for a successful call", async () => {
    mockModel({ suggestions: [], global_justification: "", suggested_topics: [], no_match: true })

    const { calls } = await aiMatchService.findOptimalMentors(fakeSupabase, "quero abrir um negócio", mentors)

    expect(calls).toEqual([
      expect.objectContaining({
        provider: "openai",
        model: "gpt-4o-mini",
        inputTokens: 1200,
        outputTokens: 150,
        cachedInputTokens: 1000,
        status: "ok"
      })
    ])
  })

  it("records the failed attempt and the keyword fallback when every model in the chain fails", async () => {
    mockGetStructuredModel.mockImplementation(async (_supabase, _capability, _schema, opts) => {
      opts.onCall({
        provider: "openai",
        model: "gpt-4o-mini",
        inputTokens: 900,
        outputTokens: 0,
        cachedInputTokens: 0,
        latencyMs: 300,
        status: "error",
        errorCode: "http_503"
      })
      return {
        invoke: async () => {
          throw new Error("all attempts failed")
        }
      } as never
    })

    const { calls, result } = await aiMatchService.findOptimalMentors(fakeSupabase, "pedagoga educação", mentors)

    expect(calls.map((c) => [c.provider, c.status])).toEqual([
      ["openai", "error"],
      ["local", "fallback"]
    ])
    expect(result.suggestions[0]?.mentor_id).toBe("5ebf2ecb-5dc0-4c06-bd77-0c27831239bc")
  })

  it("falls back to keyword matching without a failed-call record when no provider has an API key", async () => {
    mockGetStructuredModel.mockRejectedValue(new AiModelUnavailableError("rank"))

    const { calls, result } = await aiMatchService.findOptimalMentors(fakeSupabase, "quero ser professor pedagoga", mentors)

    expect(calls).toEqual([expect.objectContaining({ provider: "local", model: "keyword", status: "fallback" })])
    expect(result.no_match).toBe(false)
    expect(result.suggestions[0]?.mentor_id).toBe("5ebf2ecb-5dc0-4c06-bd77-0c27831239bc")
  })
})
