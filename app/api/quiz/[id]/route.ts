import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { quizIdParamSchema } from "@/lib/schemas/quiz"
import { buildQuizService } from "@/lib/services/quiz/quiz.composition"

/**
 * GET /api/quiz/[id] - the public result view for `/quiz/results/[id]`, a
 * link shared on LinkedIn/WhatsApp by design.
 *
 * Goes through the `get_quiz_result` RPC (via the quiz repository): it returns
 * only `id`, `processed_at` and `ai_analysis`, never name/e-mail/raw answers,
 * so this stays a public (no-session) route by design. A non-UUID id is a 400
 * now; it used to reach the database and come back as a 500.
 */
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = quizIdParamSchema.safeParse(await context.params)
  if (!params.success) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 })
  }

  const supabase = await createClient()
  const service = buildQuizService(supabase)

  // Owner-only actions (sharing with a mentor) need to know whether the
  // viewer is the person who took the quiz - the link itself is public.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  try {
    const result = await service.getResult(params.data.id, !!user)
    if (!result) {
      return NextResponse.json({ error: "Resultado não encontrado" }, { status: 404 })
    }
    return NextResponse.json(result)
  } catch (error) {
    console.error("[GET /api/quiz/[id]] Erro ao carregar resultado:", (error as Error).message)
    return NextResponse.json({ error: "Não foi possível carregar o resultado" }, { status: 500 })
  }
}
