import { after, NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { communityMatchService } from "@/lib/services/ai/community-match.service"
import { getMenteeCandidates } from "@/lib/services/ai/mentee-candidates.service"
import { aiMatchQuerySchema } from "@/lib/schemas/ai"
import { consumeAiQuota } from "@/lib/ai/quota"
import { recordAiCalls } from "@/lib/ai/metering"

/**
 * AI community match — a mentor describes who they want to help and gets
 * back matching mentee/learner profiles. Mirrors `/api/ai/match` (mentor
 * search) step for step; it shares the same "match" quota feature since both
 * are the same product capability aimed at different audiences, so no extra
 * entitlement row is needed for this endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    const validation = aiMatchQuerySchema.safeParse(await request.json())
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "Busca inválida" },
        { status: 400 }
      )
    }

    const { query } = validation.data
    const supabase = await createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "É necessário estar logado para usar a busca com IA." },
        { status: 401 }
      )
    }

    const mentees = await getMenteeCandidates(supabase)

    if (mentees.length === 0) {
      return NextResponse.json({
        no_match: true,
        global_justification: "Ainda não temos membros suficientes na comunidade para essa busca.",
        suggestions: [],
        suggested_topics: []
      })
    }

    const quota = await consumeAiQuota(supabase, "match")
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error:
            quota.reason === "budget"
              ? "A busca com IA atingiu o limite de uso da plataforma neste mês."
              : "Você atingiu o limite mensal de buscas com IA.",
          code: quota.reason === "budget" ? "budget_exceeded" : "quota_exceeded",
          quota
        },
        { status: 429 }
      )
    }

    const { result, calls } = await communityMatchService.findBestMentees(supabase, query, mentees)

    after(async () => {
      await recordAiCalls(supabase, "match", calls)
    })

    return NextResponse.json({ ...result, quota })
  } catch (error) {
    console.error("[AICommunityMatchRoute] error:", error)
    return NextResponse.json({ error: "Erro interno no processamento de IA." }, { status: 500 })
  }
}
