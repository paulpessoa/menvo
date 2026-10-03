import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { sendQuizResultsEmail } from "@/lib/email/brevo"
import { buildResultUrl } from "@/lib/quiz/result-link"
import type { QuizAnalysis } from "@/lib/domain/quiz/quiz.entity"

export type QuizEmailOutcome = "sent" | "not_found" | "not_ready" | "failed"

/**
 * Sends the quiz results e-mail for one response (server-only). Reads the
 * row with the service role: the address is never taken from the caller, so
 * the e-mail only ever goes to whoever submitted the quiz.
 *
 * Replaces the `send-quiz-email` Edge Function, so the quiz e-mail shares the
 * layout and founder signature of every other Menvo e-mail (lib/email/brevo.ts).
 */
export async function sendQuizResultsEmailFor(id: string): Promise<QuizEmailOutcome> {
  const supabase = createServiceRoleClient()
  const { data: row, error } = await supabase
    .from("quiz_responses")
    .select("id, name, email, ai_analysis, user_id")
    .eq("id", id)
    .maybeSingle()

  if (error || !row) return "not_found"

  const analysis = row.ai_analysis as unknown as QuizAnalysis | null
  // "precisa_refazer" results are a nudge to answer again, not an analysis
  // worth e-mailing.
  if (!analysis || analysis.precisa_refazer) return "not_ready"

  const result = await sendQuizResultsEmail({
    email: row.email,
    name: row.name || "",
    title: analysis.titulo_personalizado || "Sua análise de carreira",
    summary: analysis.resumo_motivador || "",
    resultUrl: buildResultUrl(row.id, row.email),
    isAuthenticated: !!row.user_id
  })

  if (!result.success) {
    console.error("[quiz-email] falha ao enviar:", result.error)
    return "failed"
  }

  await supabase
    .from("quiz_responses")
    .update({ email_sent: true, email_sent_at: new Date().toISOString() })
    .eq("id", id)

  return "sent"
}
