/**
 * Camada 3 · Entity (quiz)
 * Regra: o que o negócio entende de um quiz, derivado da Row gerada (camada 2)
 * para manter o elo com o banco. TypeScript puro: sem Supabase, React ou Next.
 * Não faz: validar dado externo (camada 4) nem acessar o banco (camada 5).
 * Tradeoff: `QuizAnalysis` é a forma LIDA do `ai_analysis` (jsonb), com campos
 * opcionais porque linhas antigas (Edge Function com gpt-3.5) podem não ter
 * todos. É diferente de `QuizAnalysisResult` em `lib/ai-menvo/diagnostic/analyze.ts`,
 * que é o contrato ESTRITO que o modelo de IA precisa devolver; o estrito é
 * atribuível a este. snake_case mantido, como no resto do repo.
 */
import type { Tables } from "@/lib/types/supabase"

type QuizRow = Tables<"quiz_responses">

export interface SuggestedMentor {
  tipo: string
  razao: string
  disponivel: boolean
  mentor_nome?: string
}

export interface QuizAnalysis {
  precisa_refazer?: boolean
  titulo_personalizado: string
  resumo_motivador: string
  mentores_sugeridos: SuggestedMentor[]
  conselhos_praticos: string[]
  proximos_passos: string[]
  areas_desenvolvimento: string[]
  mensagem_final: string
  potencial_mentor?: boolean
  areas_vida_pessoal?: string[]
}

/** As respostas do formulário que a análise de IA recebe. */
export interface QuizAnswers {
  name: string
  career_moment: string
  mentorship_experience: string
  development_areas: string[]
  current_challenge: string
  future_vision: string
  share_knowledge: string
  personal_life_help: string
}

/** O dono do quiz vendo o próprio resumo (dashboard do mentorado). Inclui e-mail e nome. */
export type QuizSummary = Pick<
  QuizRow,
  | "id"
  | "name"
  | "email"
  | "score"
  | "processed_at"
  | "created_at"
  | "career_moment"
  | "development_areas"
> & {
  ai_analysis: QuizAnalysis | null
}

/**
 * O que `/quiz/results/[id]` mostra. Sem nome, e-mail nem respostas: o link é
 * compartilhado no LinkedIn/WhatsApp de propósito, então não pode carregar dado pessoal.
 */
export type QuizResultView = Pick<QuizRow, "id" | "processed_at"> & {
  ai_analysis: QuizAnalysis | null
  /** True só para a pessoa logada que fez este quiz. */
  is_owner?: boolean
}

/** A análise já foi salva. */
export function isAnalysisReady(quiz: { ai_analysis: QuizAnalysis | null }): boolean {
  return quiz.ai_analysis !== null
}

/**
 * Análise do tipo "responda de novo": é um aviso, não um resultado que valha
 * mostrar como diagnóstico nem enviar por e-mail.
 */
export function needsRetake(quiz: { ai_analysis: QuizAnalysis | null }): boolean {
  return quiz.ai_analysis?.precisa_refazer === true
}
