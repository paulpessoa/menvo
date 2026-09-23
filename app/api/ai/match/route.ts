import { after, NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { aiMatchService } from "@/lib/services/ai/match.service"
import { getMentorCandidates } from "@/lib/services/ai/mentor-candidates.service"
import { aiMatchQuerySchema } from "@/lib/schemas/ai"
import { consumeAiQuota } from "@/lib/ai/quota"
import { recordAiCalls } from "@/lib/ai/metering"

/**
 * AI mentor search. Order matters for cost control:
 * auth → candidates (free) → quota credit → LLM → metering (after response).
 * The credit is taken right before the only step that spends money.
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

    const { query, debug } = validation.data
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

    const mentors = await getMentorCandidates(supabase, { includeUnverified: debug })

    if (mentors.length === 0) {
      return NextResponse.json({
        no_match: true,
        global_justification: "Ainda não temos mentores cadastrados disponíveis na plataforma.",
        suggestions: [],
        suggested_topics: ["Carreira", "Tecnologia", "Liderança"]
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

    const { result, calls } = await aiMatchService.findOptimalMentors(supabase, query, mentors)

    after(async () => {
      await recordAiCalls(supabase, "match", calls)
      const { error } = await supabase.from("ai_missing_demands").insert({
        user_id: user.id,
        query_text: query,
        suggested_topics: result.suggested_topics,
        matched_count: result.suggestions.length
      })
      if (error) console.warn("[AIMatchRoute] demand tracking failed:", error.message)
    })

    return NextResponse.json({
      ...result,
      quota,
      ...(debug ? { debug_context: mentors } : {})
    })
  } catch (error) {
    console.error("[AIMatchRoute] error:", error)
    return NextResponse.json({ error: "Erro interno no processamento de IA." }, { status: 500 })
  }
}
