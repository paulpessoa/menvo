/**
 * Regression tests for the AI match service:
 * - hallucinated mentor_ids (e.g. a slugified name) must be filtered out
 *   server-side, since one bad id used to break the client's follow-up DB
 *   lookup for every suggested mentor (see getMentorsByIds);
 * - every attempt is returned as a metering record with the provider's real
 *   token counts, including failed attempts and the keyword fallback.
 */
import type { aiMatchService as AiMatchService, MentorContextItem } from "./groq.service"

// `require` (not `import`) on purpose: ES imports are hoisted above regular
// statements, so setting these env vars first only works with a runtime
// require — the module reads OPENAI_API_KEY/GROQ_API_KEY once at load time.
process.env.OPENAI_API_KEY = "test-key"
delete process.env.GROQ_API_KEY
const { aiMatchService } = require("./groq.service") as { aiMatchService: typeof AiMatchService }

const mentors: MentorContextItem[] = [
  { id: "5ebf2ecb-5dc0-4c06-bd77-0c27831239bc", full_name: "Nayane Prudencio", job_title: "Pedagoga" },
  { id: "0b6b4c43-af6b-48cb-8cf2-22912302eec1", full_name: "Márcia Lima", job_title: "Consultora" }
]

const usage = { prompt_tokens: 1200, completion_tokens: 150, prompt_tokens_details: { cached_tokens: 1000 } }

function mockOpenAI(content: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ choices: [{ message: { content: JSON.stringify(content) } }], usage })
  }) as unknown as typeof fetch
}

describe("aiMatchService.findOptimalMentors — hallucinated mentor_id", () => {
  it("drops suggestions whose mentor_id is not a real mentor id", async () => {
    mockOpenAI({
      suggestions: [
        { mentor_id: "5ebf2ecb-5dc0-4c06-bd77-0c27831239bc", reason: "real match" },
        { mentor_id: "marcia_lima", reason: "hallucinated id" }
      ],
      global_justification: "test",
      suggested_topics: ["Educação"],
      no_match: false
    })

    const { result } = await aiMatchService.findOptimalMentors("quero ser professor", mentors)

    expect(result.suggestions).toHaveLength(1)
    expect(result.suggestions[0].mentor_id).toBe("5ebf2ecb-5dc0-4c06-bd77-0c27831239bc")
    expect(result.no_match).toBe(false)
  })

  it("falls back to no_match when every suggestion is hallucinated", async () => {
    mockOpenAI({
      suggestions: [{ mentor_id: "nayane_prudencio", reason: "hallucinated id" }],
      global_justification: "test",
      suggested_topics: ["Educação"],
      no_match: false
    })

    const { result } = await aiMatchService.findOptimalMentors("quero trabalhar com crianças", mentors)

    expect(result.suggestions).toHaveLength(0)
    expect(result.no_match).toBe(true)
  })

  it("keeps a fully valid result untouched", async () => {
    mockOpenAI({
      suggestions: [{ mentor_id: "0b6b4c43-af6b-48cb-8cf2-22912302eec1", reason: "real match" }],
      global_justification: "test",
      suggested_topics: ["Empreendedorismo"],
      no_match: false
    })

    const { result } = await aiMatchService.findOptimalMentors("quero abrir um negócio", mentors)

    expect(result.suggestions).toHaveLength(1)
    expect(result.no_match).toBe(false)
  })
})

describe("aiMatchService.findOptimalMentors — metering", () => {
  it("reports the provider's token usage for a successful call", async () => {
    mockOpenAI({ suggestions: [], global_justification: "", suggested_topics: [], no_match: true })

    const { calls } = await aiMatchService.findOptimalMentors("quero abrir um negócio", mentors)

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

  it("records a failed attempt and the keyword fallback when the provider errors", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "unavailable"
    }) as unknown as typeof fetch

    const { calls, result } = await aiMatchService.findOptimalMentors("pedagoga educação", mentors)

    expect(calls.map((c) => [c.provider, c.status, c.errorCode])).toEqual([
      ["openai", "error", "http_503"],
      ["local", "fallback", undefined]
    ])
    expect(result.suggestions[0]?.mentor_id).toBe("5ebf2ecb-5dc0-4c06-bd77-0c27831239bc")
  })

  it("keeps billed tokens when the model returns unusable JSON", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "not json" } }], usage })
    }) as unknown as typeof fetch

    const { calls } = await aiMatchService.findOptimalMentors("quero abrir um negócio", mentors)

    expect(calls[0]).toMatchObject({ status: "error", errorCode: "invalid_output", inputTokens: 1200 })
  })
})
