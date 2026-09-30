import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import type { QuizAnalysisResult } from "@/lib/types/models/quiz"

/**
 * GET /api/quiz/[id] - the public result view for `/quiz/results/[id]`, a
 * link shared on LinkedIn/WhatsApp by design. Replaces
 * `quizService.getQuizResponseById`, which called the `get_quiz_result` RPC
 * straight from the browser (docs/COMMUNITY_CONTACT_PLAN.md §13).
 *
 * Goes through the same `get_quiz_result` RPC as before: it returns only
 * `id`, `processed_at` and `ai_analysis`, never name/e-mail/raw answers, so
 * this stays a public (no-session) route by design.
 */
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: "id é obrigatório" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_quiz_result", { p_id: id })

  if (error) {
    console.error("[GET /api/quiz/[id]] Erro ao carregar resultado:", error.message)
    return NextResponse.json({ error: "Não foi possível carregar o resultado" }, { status: 500 })
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row) {
    return NextResponse.json({ error: "Resultado não encontrado" }, { status: 404 })
  }

  // Owner-only actions (sharing with a mentor) need to know whether the
  // viewer is the person who took the quiz - the link itself is public.
  const {
    data: { user },
  } = await supabase.auth.getUser()
  let isOwner = false
  if (user) {
    const { data: owns } = await supabase.rpc("owns_quiz_response", { p_id: row.id })
    isOwner = owns === true
  }

  return NextResponse.json({
    id: row.id,
    processed_at: row.processed_at,
    ai_analysis: (row.ai_analysis as unknown as QuizAnalysisResult) || null,
    is_owner: isOwner,
  })
}
