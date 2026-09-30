import { cache } from "react"
import { createClient } from "@supabase/supabase-js"

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
    const { data, error } = await (supabase.rpc as any)("get_quiz_result", { p_id: id })
    if (error) return null

    const row = Array.isArray(data) ? data[0] : data
    const analysis = row?.ai_analysis
    if (!analysis?.titulo_personalizado) return null

    return {
      title: String(analysis.titulo_personalizado),
      needsRetake: Boolean(analysis.precisa_refazer)
    }
  } catch {
    return null
  }
})
