import { NextRequest, NextResponse, after } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { quizSubmitSchema } from "@/lib/schemas/quiz"
import { buildQuizService } from "@/lib/services/quiz/quiz.composition"

// `after()` work counts against the function's duration; the analyze call it
// waits on has the same 60s cap.
export const maxDuration = 60

/**
 * POST /api/quiz - submits a new quiz response and kicks off the (async,
 * best-effort) AI analysis.
 *
 * Thin on purpose: per-IP speed bump -> Zod -> `quizService.submit` (limits,
 * session e-mail, insert; lib/services/quiz/quiz.server.service.ts) -> status.
 *
 * Anonymous by design (the quiz itself is anonymous - D1 in the AI platform
 * plan): no session is required. `quiz_responses`' insert policy already
 * rejects a client-planted ai_analysis/score/processed_at
 * (20260923000005_quiz_responses_privacy.sql); the Zod schema here is a
 * first line of defense, not the only one.
 *
 * Limit: 3 analyses per e-mail every 30 days, plus the global monthly AI
 * budget (`quiz_submission_status`, enforced again by the insert policy).
 * The per-IP counter below is only a speed bump - it lives in one
 * serverless instance's memory.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1"
  const rate = checkRateLimit(`quiz-submit:${ip}`, { maxRequests: 8, windowMs: 10 * 60_000 })
  if (!rate.allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente em alguns minutos." }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const parsed = quizSubmitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const result = await buildQuizService(supabase).submit({ input: parsed.data, ip, user })

  if (result.kind === "limit") {
    const { limitCount } = result
    return NextResponse.json(
      {
        error: `Você já fez ${limitCount} análise${limitCount > 1 ? "s" : ""} nos últimos 30 dias. Tente novamente no mês que vem.`,
        code: result.code,
      },
      { status: 429 }
    )
  }
  if (result.kind === "budget") {
    return NextResponse.json(
      { error: "As análises gratuitas deste mês acabaram. Tente novamente a partir do dia 1º.", code: "budget" },
      { status: 503 }
    )
  }
  if (result.kind === "failed") {
    return NextResponse.json({ error: "Não foi possível salvar suas respostas" }, { status: 500 })
  }

  // Best-effort trigger, run after the response is sent: the analysis takes
  // 10s+ and awaiting it here hit FUNCTION_INVOCATION_TIMEOUT (504). The
  // results page polls and retries on its own, so a failure here (e.g. AI
  // budget exhausted) never matters to the caller.
  const analyzeUrl = new URL(`/api/quiz/${result.id}/analyze`, request.url)
  after(async () => {
    try {
      await fetch(analyzeUrl, { method: "POST" })
    } catch (analysisError) {
      console.warn("[POST /api/quiz] Aviso ao disparar análise:", analysisError)
    }
  })

  return NextResponse.json({ id: result.id })
}
