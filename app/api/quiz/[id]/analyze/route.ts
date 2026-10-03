import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { quizIdParamSchema } from "@/lib/schemas/quiz"
import { buildQuizService } from "@/lib/services/quiz/quiz.composition"

// gemini-2.5-flash took ~10s for one analysis in a real run (2026-09-23);
// the platform default could kill the function after claiming the row but
// before saving, leaving the results page waiting. Same cap as /api/assistant.
export const maxDuration = 60

/**
 * Replaces `supabase/functions/analyze-quiz` (ADR 0004 §7.3, decision D8 =
 * option A): runs the quiz analysis through the model registry, metered and
 * inside the global AI budget, and - unlike the old Edge Function - cannot
 * be re-triggered without limit just by knowing a quiz response's `id`.
 *
 * Anonymous by design (the quiz itself is anonymous, D1): `claim_quiz_analysis`
 * is the only thing that reads `quiz_responses` here, and it's the gate -
 * RLS on that table denies a direct anonymous read (migration `…000005`).
 *
 * Thin: the claim -> mentors -> AI -> save -> e-mail sequence lives in
 * `quizService.runAnalysis`.
 */
export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = quizIdParamSchema.safeParse(await context.params)
  if (!params.success) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 })
  }

  const serverKey = process.env.AI_METERING_KEY
  if (!serverKey) {
    console.warn("[quiz/analyze] AI_METERING_KEY não configurada - análise indisponível")
    return NextResponse.json({ error: "Análise temporariamente indisponível" }, { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const outcome = await buildQuizService(supabase).runAnalysis({
    id: params.data.id,
    serverKey,
    isAuthenticated: !!user,
  })

  if (outcome.kind === "claim_failed") {
    return NextResponse.json({ error: "Não foi possível processar este questionário" }, { status: 500 })
  }
  // Not claimed is not an error: the results page polls regardless.
  return NextResponse.json({ ok: true, claimed: outcome.kind === "done" })
}
