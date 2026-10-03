/**
 * Camada 5 · Repository (mentores para a análise do quiz)
 * Regra: lista os mentores que a IA pode sugerir. Mora separado de
 * `quiz.repository.ts` porque a tabela (`mentors_view`) é do domínio de mentores.
 * Não faz: escolher quem sugerir (isso é o prompt/`analyzeQuiz`).
 * Tradeoff: se não houver mentor verificado e público, cai para qualquer um da
 * view, para a análise nunca sugerir "ninguém" por falta de dado.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { AnalysisMentor } from "@/lib/ai-menvo/diagnostic/analyze"

export interface AnalysisMentorSource {
  list(): Promise<AnalysisMentor[]>
}

const COLUMNS =
  "id, full_name, bio, job_title, company, expertise_areas, mentor_skills, mentorship_topics, availability_status, average_rating, total_reviews, total_sessions"

export function createAnalysisMentorSource(db: SupabaseClient): AnalysisMentorSource {
  return {
    async list() {
      const { data: verified } = await db
        .from("mentors_view")
        .select(COLUMNS)
        .eq("verified", true)
        .eq("is_public", true)
        .limit(50)

      if (verified && verified.length > 0) return verified as unknown as AnalysisMentor[]

      const { data: fallback } = await db.from("mentors_view").select(COLUMNS).limit(50)
      return (fallback ?? []) as unknown as AnalysisMentor[]
    },
  }
}
