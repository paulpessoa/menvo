import { after, NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { consumeAiQuota } from "@/lib/ai/quota"
import { recordAiCalls, type AiCallRecord } from "@/lib/ai/metering"
import { AiModelUnavailableError } from "@/lib/ai/models"
import {
  draftMentorReview,
  loadMentorApplication,
  mentorReviewKindSchema
} from "@/lib/ai-menvo/mentor-review/draft"

const bodySchema = z.object({
  userId: z.string().uuid(),
  kind: mentorReviewKindSchema,
  instructions: z.string().trim().max(500).optional()
})

/**
 * AI draft for the mentor verification screen: an assessment of the
 * application plus the approval message, the adjustment request, or a
 * LinkedIn announcement post. Suggestion only — it never notifies anyone;
 * the admin edits the text and sends it through /api/admin/verify.
 */
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const parsed = bodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })
    }
    const { userId, kind, instructions } = parsed.data

    const supabase = await createClient()
    const application = await loadMentorApplication(supabase, userId)
    if (!application) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
    }

    const quota = await consumeAiQuota(supabase, "admin_mentor_review")
    if (!quota.allowed) {
      return NextResponse.json({ error: "Limite mensal de IA atingido", quota }, { status: 429 })
    }

    const calls: AiCallRecord[] = []
    try {
      const draft = await draftMentorReview(supabase, application, kind, {
        instructions,
        onCall: (record) => calls.push(record)
      })
      return NextResponse.json({ kind, draft })
    } finally {
      after(() => recordAiCalls(supabase, "admin_mentor_review", calls))
    }
  } catch (error) {
    if (error instanceof AiModelUnavailableError) {
      return NextResponse.json({ error: "IA indisponível no momento" }, { status: 503 })
    }
    console.error("[API verifications/draft] Erro:", error)
    return NextResponse.json({ error: "Erro ao gerar rascunho" }, { status: 500 })
  }
}
