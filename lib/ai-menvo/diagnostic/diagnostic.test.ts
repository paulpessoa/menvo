/**
 * @jest-environment node
 */
import { DIAGNOSTIC_STEPS, TOTAL_DIAGNOSTIC_STEPS } from "./steps"
import { checkCrisisTrigger, CRISIS_SAFEGUARD_MESSAGE } from "./extract"
import { isAnswerTooVague } from "./followup"

describe("Diagnostic Steps & Guardrails", () => {
  it("defines all 7 diagnostic steps with required properties", () => {
    expect(TOTAL_DIAGNOSTIC_STEPS).toBe(7)
    for (let step = 1; step <= 7; step++) {
      const def = DIAGNOSTIC_STEPS[step as keyof typeof DIAGNOSTIC_STEPS]
      expect(def).toBeDefined()
      expect(def.id).toBe(step)
      expect(def.name).toBeTruthy()
      expect(def.questionText).toBeTruthy()
      expect(def.inputType).toBeDefined()
    }
  })

  it("Step 1 and Step 5 allow custom 'other' options", () => {
    expect(DIAGNOSTIC_STEPS[1].allowOther).toBe(true)
    expect(DIAGNOSTIC_STEPS[5].allowOther).toBe(true)
  })

  it("Step 6 (personal life) is optional and can be skipped", () => {
    expect(DIAGNOSTIC_STEPS[6].canSkip).toBe(true)
  })

  describe("checkCrisisTrigger", () => {
    it("detects crisis / self-harm keywords and triggers safeguard", () => {
      expect(checkCrisisTrigger("estou pensando em suicidio")).toBe(true)
      expect(checkCrisisTrigger("tenho vontade de me matar")).toBe(true)
      expect(checkCrisisTrigger("não quero mais viver")).toBe(true)
    })

    it("does not trigger on normal career distress", () => {
      expect(checkCrisisTrigger("estou estressado com meu trabalho atual")).toBe(false)
      expect(checkCrisisTrigger("perdi meu emprego e preciso de ajuda")).toBe(false)
      expect(checkCrisisTrigger("")).toBe(false)
    })

    it("provides the CVV 188 hotline in CRISIS_SAFEGUARD_MESSAGE", () => {
      expect(CRISIS_SAFEGUARD_MESSAGE).toContain("188")
      expect(CRISIS_SAFEGUARD_MESSAGE).toContain("cvv.org.br")
    })
  })

  describe("isAnswerTooVague", () => {
    it("flags answers shorter than 15 characters as vague", () => {
      expect(isAnswerTooVague("nada")).toBe(true)
      expect(isAnswerTooVague("sei lá")).toBe(true)
      expect(isAnswerTooVague("não sei")).toBe(true)
    })

    it("flags answers containing vague phrases as vague", () => {
      expect(isAnswerTooVague("qualquer coisa que der certo pra mim")).toBe(true)
      expect(isAnswerTooVague("não sei bem o que quero fazer")).toBe(true)
    })

    it("accepts specific, detailed answers as not vague", () => {
      expect(isAnswerTooVague("Quero me tornar desenvolvedor frontend especializado em React e Next.js")).toBe(false)
      expect(isAnswerTooVague("Meu maior desafio é conseguir passar nas entrevistas técnicas em inglês")).toBe(false)
    })
  })
})
