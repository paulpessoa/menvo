import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { recordAiCalls, type AiCallRecord } from "@/lib/ai/metering"
import { analyzeQuiz, type AnalysisMentor, type QuizAnswers } from "@/lib/ai-menvo/diagnostic/analyze"

// gemini-2.5-flash took ~10s for one analysis in a real run (2026-09-23);
// the platform default could kill the function after claiming the row but
// before saving, leaving the results page waiting. Same cap as /api/assistant.
export const maxDuration = 60

/**
 * Replaces `supabase/functions/analyze-quiz` (ADR 0004 §7.3, decision D8 =
 * option A): runs the quiz analysis through the model registry, metered and
 * inside the global AI budget, and — unlike the old Edge Function — cannot
 * be re-triggered without limit just by knowing a quiz response's `id`.
 *
 * Anonymous by design (the quiz itself is anonymous, D1): `claim_quiz_analysis`
 * is the only thing that reads `quiz_responses` here, and it's the gate —
 * RLS on that table denies a direct anonymous read (migration `…000005`).
 */
export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: "id é obrigatório" }, { status: 400 })
  }

  const serverKey = process.env.AI_METERING_KEY
  if (!serverKey) {
    console.warn("[quiz/analyze] AI_METERING_KEY não configurada — análise indisponível")
    return NextResponse.json({ error: "Análise temporariamente indisponível" }, { status: 503 })
  }

  const supabase = await createClient()

  const { data: claimRows, error: claimError } = await supabase.rpc("claim_quiz_analysis", {
    p_server_key: serverKey,
    p_id: id
  })

  if (claimError) {
    console.error("[quiz/analyze] falha ao reivindicar análise:", claimError.message)
    return NextResponse.json({ error: "Não foi possível processar este questionário" }, { status: 500 })
  }

  const claim = Array.isArray(claimRows) ? claimRows[0] : claimRows

  // Not claimed: already processed, claimed by another request in the last
  // 2 minutes, or the platform budget is exhausted this month. The results
  // page (`/quiz/results/[id]`) polls regardless, so this is not an error —
  // it just means "nothing to do right now".
  if (!claim?.claimed) {
    return NextResponse.json({ ok: true, claimed: false })
  }

  const answers: QuizAnswers = {
    name: claim.name ?? "",
    career_moment: claim.career_moment ?? "",
    mentorship_experience: claim.mentorship_experience ?? "",
    development_areas: claim.development_areas ?? [],
    current_challenge: claim.current_challenge ?? "",
    future_vision: claim.future_vision ?? "",
    share_knowledge: claim.share_knowledge ?? "",
    personal_life_help: claim.personal_life_help ?? ""
  }

  const { data: mentorRows } = await supabase
    .from("mentors_view")
    .select(
      "id, full_name, bio, job_title, company, expertise_areas, mentor_skills, mentorship_topics, availability_status, is_available, average_rating, total_reviews, total_sessions"
    )
    .eq("is_available", true)

  const mentors = (mentorRows ?? []) as unknown as AnalysisMentor[]

  const calls: AiCallRecord[] = []
  const { analysis } = await analyzeQuiz(supabase, answers, mentors, {
    onCall: (record) => calls.push(record)
  })

  const { error: saveError } = await supabase.rpc("save_quiz_analysis", {
    p_server_key: serverKey,
    p_id: id,
    p_analysis: analysis,
    p_score: null
  })

  if (saveError) {
    console.error("[quiz/analyze] falha ao salvar análise:", saveError.message)
  }

  await recordAiCalls(supabase, "quiz_analysis", calls)

  return NextResponse.json({ ok: true, claimed: true })
}
