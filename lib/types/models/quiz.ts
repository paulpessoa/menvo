import type { Database } from "@/lib/types/supabase"

export type QuizResponseRow = Database["public"]["Tables"]["quiz_responses"]["Row"]
export type QuizResponseInsert = Database["public"]["Tables"]["quiz_responses"]["Insert"]

export interface SuggestedMentorSummary {
  tipo: string
  razao: string
  disponivel: boolean
  mentor_nome?: string
}

export interface QuizAnalysisResult {
  precisa_refazer?: boolean
  titulo_personalizado: string
  resumo_motivador: string
  mentores_sugeridos: SuggestedMentorSummary[]
  conselhos_praticos: string[]
  proximos_passos: string[]
  areas_desenvolvimento: string[]
  mensagem_final: string
  potencial_mentor?: boolean
  areas_vida_pessoal?: string[]
}

export interface QuizResponseSummary {
  id: string
  name: string
  email: string
  score: number | null
  processed_at: string | null
  created_at: string | null
  development_areas: string[]
  career_moment: string
  ai_analysis: QuizAnalysisResult | null
}
