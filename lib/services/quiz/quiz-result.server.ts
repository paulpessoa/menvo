import { cache } from "react"
import { createClient } from "@supabase/supabase-js"
import { createQuizRepository } from "@/lib/repositories/quiz.repository"
import { needsRetake } from "@/lib/domain/quiz/quiz.entity"

export interface QuizResultPreview {
  title: string
  needsRetake: boolean
}

/**
 * Minimal, share-safe view of a quiz result for link previews (Open Graph
 * metadata and the generated preview image). Uses the anonymous key —
 * `get_quiz_result` is granted to `anon` — and exposes only the headline,
 * never the summary or the person's answers.
 */
export const getQuizResultPreview = cache(async (id: string): Promise<QuizResultPreview | null> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!id || !url || !key) return null

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } })
    const row = await createQuizRepository(supabase).getResult(id)
    if (!row?.ai_analysis?.titulo_personalizado) return null

    return {
      title: String(row.ai_analysis.titulo_personalizado),
      needsRetake: needsRetake(row)
    }
  } catch {
    return null
  }
})
