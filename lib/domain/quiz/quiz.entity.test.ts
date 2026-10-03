import { isAnalysisReady, needsRetake, type QuizAnalysis } from "./quiz.entity"

const analysis: QuizAnalysis = {
  titulo_personalizado: "t",
  resumo_motivador: "r",
  mentores_sugeridos: [],
  conselhos_praticos: [],
  proximos_passos: [],
  areas_desenvolvimento: [],
  mensagem_final: "m",
}

describe("quiz entity", () => {
  it("isAnalysisReady is true only when an analysis was saved", () => {
    expect(isAnalysisReady({ ai_analysis: null })).toBe(false)
    expect(isAnalysisReady({ ai_analysis: analysis })).toBe(true)
  })

  it("needsRetake only for an explicit precisa_refazer", () => {
    expect(needsRetake({ ai_analysis: null })).toBe(false)
    expect(needsRetake({ ai_analysis: analysis })).toBe(false)
    expect(needsRetake({ ai_analysis: { ...analysis, precisa_refazer: true } })).toBe(true)
  })
})
