import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { checkRateLimit } from "@/lib/rate-limit"

/**
 * POST /api/quiz/[id]/send-email - re-sends the quiz results by e-mail
 * (invokes the `send-quiz-email` Edge Function, which reads the row with
 * the service role and mails whatever address the person submitted).
 * Replaces `quizService.sendResultsEmail`, which invoked the Edge Function
 * straight from the browser (docs/COMMUNITY_CONTACT_PLAN.md §13).
 *
 * No session required - same as the results page itself, the `id` (a UUID)
 * is the only credential, and the e-mail only ever goes to the address on
 * that row. Rate-limited per id so the "resend" button can't be used to
 * spam that address.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: "id é obrigatório" }, { status: 400 })
  }

  const rate = checkRateLimit(`quiz-send-email:${id}`, { maxRequests: 3, windowMs: 10 * 60_000 })
  if (!rate.allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente em alguns minutos." }, { status: 429 })
  }

  const supabase = await createClient()
  const { error } = await supabase.functions.invoke("send-quiz-email", {
    body: { responseId: id },
  })

  if (error) {
    console.error("[POST /api/quiz/[id]/send-email] Erro ao enviar e-mail:", error.message)
    return NextResponse.json({ error: "Não foi possível enviar o e-mail" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
