import { NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import type { QuizAnalysis } from "@/lib/domain/quiz/quiz.entity"

/**
 * GET /api/quiz/latest - the caller's own most recent quiz response, used by
 * `/dashboard/mentee` to show whether the diagnostic was already done.
 * Replaces `quizService.getLatestQuizResponseByEmail`, which queried
 * `quiz_responses` straight from the browser with a client-supplied e-mail
 * (docs/COMMUNITY_CONTACT_PLAN.md §13).
 *
 * The e-mail is taken from the session, never from a query param: RLS
 * ("Users read own quiz responses") already limits reads to
 * `email = auth.jwt() ->> 'email'`, but deriving it here too means an
 * authenticated caller can't even ask for someone else's e-mail by mistake.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("quiz_responses")
    .select("id, name, email, score, processed_at, created_at, development_areas, career_moment, ai_analysis")
    .eq("email", user.email.trim().toLowerCase())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("[GET /api/quiz/latest] Erro ao buscar última resposta:", error.message)
    return NextResponse.json({ error: "Não foi possível carregar o questionário" }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ summary: null })
  }

  return NextResponse.json({
    summary: {
      id: data.id,
      name: data.name,
      email: data.email,
      score: data.score,
      processed_at: data.processed_at,
      created_at: data.created_at,
      development_areas: data.development_areas || [],
      career_moment: data.career_moment,
      ai_analysis: (data.ai_analysis as unknown as QuizAnalysis) || null,
    },
  })
}
