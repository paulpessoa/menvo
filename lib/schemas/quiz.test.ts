/**
 * @jest-environment node
 */
import {
  quizIdParamSchema,
  quizResultViewSchema,
  quizLatestResponseSchema,
  storedQuizAnalysisSchema,
  quizAccountBodySchema,
} from "./quiz"
import { quizAnalysisSchema } from "@/lib/ai-menvo/diagnostic/analyze"

const analysis = {
  titulo_personalizado: "Rumo a dados",
  resumo_motivador: "Você está no caminho.",
  mentores_sugeridos: [{ tipo: "Dados", razao: "Alinha com seu objetivo", disponivel: true }],
  conselhos_praticos: ["Estude SQL"],
  proximos_passos: ["Marcar mentoria"],
  areas_desenvolvimento: ["dados"],
  mensagem_final: "Boa sorte!",
}

const uuid = "33333333-3333-3333-3333-333333333333"

describe("quizIdParamSchema", () => {
  it("accepts a UUID and rejects anything else", () => {
    expect(quizIdParamSchema.safeParse({ id: uuid }).success).toBe(true)
    expect(quizIdParamSchema.safeParse({ id: "../etc/passwd" }).success).toBe(false)
    expect(quizIdParamSchema.safeParse({ id: "" }).success).toBe(false)
  })
})

describe("storedQuizAnalysisSchema", () => {
  it("accepts an older row without the optional fields", () => {
    expect(storedQuizAnalysisSchema.safeParse(analysis).success).toBe(true)
  })

  it("rejects a malformed analysis instead of letting a cast hide it", () => {
    expect(storedQuizAnalysisSchema.safeParse({ ...analysis, conselhos_praticos: "x" }).success).toBe(false)
    expect(storedQuizAnalysisSchema.safeParse({ titulo_personalizado: "só o título" }).success).toBe(false)
  })

  it("accepts what the AI contract (strict) produces", () => {
    const strict = {
      ...analysis,
      precisa_refazer: false,
      potencial_mentor: false,
      areas_vida_pessoal: [],
      mentores_sugeridos: [{ tipo: "Dados", razao: "r", disponivel: true, mentor_nome: "Ana" }],
    }
    expect(quizAnalysisSchema.safeParse(strict).success).toBe(true)
    expect(storedQuizAnalysisSchema.safeParse(strict).success).toBe(true)
  })
})

describe("route output schemas", () => {
  it("result view carries only id, processed_at, analysis and is_owner (no personal data)", () => {
    const parsed = quizResultViewSchema.parse({
      id: uuid,
      processed_at: null,
      ai_analysis: analysis,
      is_owner: false,
      email: "ana@example.com",
      name: "Ana",
    })
    expect(Object.keys(parsed).sort()).toEqual(["ai_analysis", "id", "is_owner", "processed_at"])
  })

  it("latest response accepts a null summary", () => {
    expect(quizLatestResponseSchema.safeParse({ summary: null }).success).toBe(true)
  })
})

describe("quizAccountBodySchema", () => {
  it("keeps the password rules the route had inline", () => {
    expect(quizAccountBodySchema.safeParse({ token: "x".repeat(20), password: "123456" }).success).toBe(true)
    const short = quizAccountBodySchema.safeParse({ token: "x".repeat(20), password: "123" })
    expect(short.success).toBe(false)
    expect(short.success ? "" : short.error.issues[0].message).toBe("A senha deve ter no mínimo 6 caracteres.")
    expect(quizAccountBodySchema.safeParse({ token: "curto", password: "123456" }).success).toBe(false)
  })
})
