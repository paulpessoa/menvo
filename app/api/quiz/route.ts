import { NextRequest, NextResponse, after } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { quizSubmitSchema } from "@/lib/schemas/quiz"

// `after()` work counts against the function's duration; the analyze call it
// waits on has the same 60s cap.
export const maxDuration = 60

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
 * `user_id` must be `auth.uid()` when the caller is logged in (or left null
 * for an anonymous caller) - the `authenticated` insert policy
 * (20260924000001_fix_diagnostic_quiz_responses_rls.sql) rejects anything
 * else with a WITH CHECK violation, which showed up as a 500 here until this
 * was added (a pre-existing bug: the old browser-side submitQuiz never set
 * it either, so a logged-in submission from /quiz was already broken before
 * this route existed).
 *
 * Limit: 3 analyses per e-mail every 30 days, plus the global monthly AI
 * budget (`quiz_submission_status`, enforced again by the insert policy).
 * The per-IP counter below is only a speed bump - it lives in one
 * serverless instance's memory.
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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const id = crypto.randomUUID()
  const payload = parsed.data
  // A logged-in person's quiz is tied to their account e-mail, never to one
  // typed in the form - that's the address the results e-mail goes to and
  // the one the per-e-mail limit counts.
  const email = (user?.email ?? payload.email).trim().toLowerCase()

  // Same check the insert policy enforces (migration 20260930000000); asked
  // first only to answer with a message the person can act on.
  const { data: status } = await supabase.rpc("quiz_submission_status", { p_email: email })
  if (status === "email_limit") {
    return NextResponse.json(
      {
        error: "Você já fez 3 análises nos últimos 30 dias com este e-mail. Tente novamente mais tarde.",
        code: "email_limit",
      },
      { status: 429 }
    )
  }
  if (status === "budget") {
    return NextResponse.json(
      {
        error: "As análises gratuitas deste mês acabaram. Tente novamente a partir do dia 1º.",
        code: "budget",
      },
      { status: 503 }
    )
  }

  const { error } = await supabase.from("quiz_responses").insert({
    id,
    user_id: user?.id ?? null,
    name: payload.name,
    email,
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

  // Best-effort trigger, run after the response is sent: the analysis takes
  // 10s+ and awaiting it here hit FUNCTION_INVOCATION_TIMEOUT (504). The
  // results page polls and retries on its own, so a failure here (e.g. AI
  // budget exhausted) never matters to the caller.
  const analyzeUrl = new URL(`/api/quiz/${id}/analyze`, request.url)
  after(async () => {
    try {
      await fetch(analyzeUrl, { method: "POST" })
    } catch (analysisError) {
      console.warn("[POST /api/quiz] Aviso ao disparar análise:", analysisError)
    }
  })

  return NextResponse.json({ id })
}
