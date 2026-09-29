import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { quizSubmitSchema } from "@/lib/schemas/quiz"

/**
 * POST /api/quiz - submits a new quiz response and kicks off the (async,
 * best-effort) AI analysis. Replaces `quizService.submitQuiz`, which ran the
 * insert straight from the browser's Supabase client (docs/COMMUNITY_CONTACT_PLAN.md §13).
 *
 * Anonymous by design (the quiz itself is anonymous - D1 in the AI platform
 * plan): no session is required. `quiz_responses`' insert policy already
 * rejects a client-planted ai_analysis/score/processed_at
 * (20260923000005_quiz_responses_privacy.sql); the Zod schema here is a
 * first line of defense, not the only one.
 *
 * The id is generated here, not returned by a `.select()` after insert:
 * anonymous callers have no SELECT policy on this table, so a `.select()`
 * would fail even though the insert succeeded.
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
  const id = crypto.randomUUID()
  const payload = parsed.data

  const { error } = await supabase.from("quiz_responses").insert({
    id,
    name: payload.name,
    email: payload.email.trim().toLowerCase(),
    linkedin_url: payload.linkedin_url || null,
    career_moment: payload.career_moment,
    mentorship_experience: payload.mentorship_experience,
    development_areas: payload.development_areas,
    current_challenge: payload.current_challenge,
    future_vision: payload.future_vision,
    share_knowledge: payload.share_knowledge,
    personal_life_help: payload.personal_life_help,
  })

  if (error) {
    console.error("[POST /api/quiz] Erro ao inserir resposta:", error.message)
    return NextResponse.json({ error: "Não foi possível salvar suas respostas" }, { status: 500 })
  }

  // Best-effort trigger; the results page polls and retries on its own, so a
  // failure here (e.g. AI budget exhausted) never blocks the response.
  try {
    await fetch(new URL(`/api/quiz/${id}/analyze`, request.url), { method: "POST" })
  } catch (analysisError) {
    console.warn("[POST /api/quiz] Aviso ao disparar análise:", analysisError)
  }

  return NextResponse.json({ id })
}
