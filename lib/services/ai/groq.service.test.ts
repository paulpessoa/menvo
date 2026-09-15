/**
 * Regression test: the LLM occasionally hallucinates a mentor_id that isn't
 * the real UUID from the mentor list (e.g. a slugified name). A single such
 * value used to break the client's follow-up DB lookup for every suggested
 * mentor, not just the fake one — see getMentorsByIds. This test locks in
 * that hallucinated ids get filtered out server-side instead of reaching
 * the caller.
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

function mockOpenAI(content: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ choices: [{ message: { content: JSON.stringify(content) } }] })
  }) as any
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

    const result = await aiMatchService.findOptimalMentors("quero ser professor", mentors)

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

    const result = await aiMatchService.findOptimalMentors("quero trabalhar com crianças", mentors)

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

    const result = await aiMatchService.findOptimalMentors("quero abrir um negócio", mentors)

    expect(result.suggestions).toHaveLength(1)
    expect(result.no_match).toBe(false)
  })
})
