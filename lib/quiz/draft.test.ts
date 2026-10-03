import { isEmptyQuizDraft, quizDraftSchema, QUIZ_DRAFT_KEY, QUIZ_DRAFT_VERSION } from "./draft"

describe("quiz draft", () => {
  it("accepts answers and a step, and strips contact data that sneaks in", () => {
    const parsed = quizDraftSchema.parse({
      currentStep: 3,
      answers: { careerMoment: "transicao", name: "Ana", email: "ana@example.com", linkedinUrl: "x" },
    })
    expect(parsed.answers).toEqual({ careerMoment: "transicao" })
  })

  it("rejects a step outside 1..8", () => {
    expect(quizDraftSchema.safeParse({ currentStep: 0, answers: {} }).success).toBe(false)
    expect(quizDraftSchema.safeParse({ currentStep: 9, answers: {} }).success).toBe(false)
  })

  it("an untouched form is empty, so it leaves no draft behind", () => {
    expect(isEmptyQuizDraft({ currentStep: 1, answers: {} })).toBe(true)
    expect(isEmptyQuizDraft({ currentStep: 1, answers: { developmentAreas: [] } })).toBe(true)
    expect(isEmptyQuizDraft({ currentStep: 1, answers: { careerMoment: "transicao" } })).toBe(false)
    expect(isEmptyQuizDraft({ currentStep: 2, answers: {} })).toBe(false)
  })

  it("has a versioned, namespaced key", () => {
    expect(QUIZ_DRAFT_KEY).toMatch(/^menvo:/)
    expect(QUIZ_DRAFT_VERSION).toBeGreaterThanOrEqual(1)
  })
})
