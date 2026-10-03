import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { quizIdParamSchema } from "@/lib/schemas/quiz"
import { createClient } from "@/lib/utils/supabase/server"
import { buildQuizService } from "@/lib/services/quiz/quiz.composition"

/**
 * POST /api/quiz/[id]/send-email - re-sends the quiz results by e-mail (the
 * first one goes out automatically when the analysis finishes, see
 * `/api/quiz/[id]/analyze`).
 *
 * No session required - same as the results page itself, the `id` (a UUID)
 * is the only credential, and the e-mail only ever goes to the address on
 * that row. Rate-limited per id so the "resend" button can't be used to
 * spam that address. Accepted risk, see ADR 0007 §3.
 */
export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = quizIdParamSchema.safeParse(await context.params)
  if (!params.success) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 })
  }
  const { id } = params.data

  const rate = checkRateLimit(`quiz-send-email:${id}`, { maxRequests: 3, windowMs: 10 * 60_000 })
  if (!rate.allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente em alguns minutos." }, { status: 429 })
  }

  const outcome = await buildQuizService(await createClient()).sendResults(id)

  if (outcome === "not_found") {
    return NextResponse.json({ error: "Resultado não encontrado" }, { status: 404 })
  }
  if (outcome === "not_ready") {
    return NextResponse.json({ error: "A análise ainda não está pronta" }, { status: 409 })
  }
  if (outcome === "failed") {
    return NextResponse.json({ error: "Não foi possível enviar o e-mail" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
