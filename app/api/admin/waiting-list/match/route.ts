import { after, NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { aiMatchService } from "@/lib/services/ai/match.service"
import { consumeAiQuota } from "@/lib/ai/quota"
import { recordAiCalls } from "@/lib/ai/metering"

/**
 * Sugestão de match para uma pessoa da lista de espera, a partir do texto
 * de "motivação" (reason) que ela preencheu no formulário.
 *
 * Reaproveita o mesmo serviço de IA usado em /api/ai/match (busca de
 * mentores para usuários logados) — a diferença é a origem do texto de
 * busca (o campo `reason` da waiting_list em vez de uma query digitada
 * agora). Isto é apenas uma sugestão: não envia nenhum e-mail nem notifica
 * o mentor sugerido — quem decide o próximo passo é o admin.
 */
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { waitingListId } = await request.json()
    if (!waitingListId) {
      return NextResponse.json({ error: "waitingListId é obrigatório" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: entry, error: entryError } = await supabase
      .from("waiting_list")
      .select("name, email, reason")
      .eq("id", waitingListId)
      .single()

    if (entryError || !entry) {
      return NextResponse.json({ error: "Registro não encontrado na lista de espera" }, { status: 404 })
    }

    const reason = (entry as any).reason as string | null
    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: "Este registro não tem motivação preenchida para gerar um match" },
        { status: 400 }
      )
    }

    const { data: mentors } = await supabase
      .from("mentors_view")
      .select("id, full_name, job_title, mentor_skills, bio, email")
      .eq("verified", true)
      .limit(100)

    if (!mentors || mentors.length === 0) {
      return NextResponse.json({
        no_match: true,
        global_justification: "Ainda não há mentores verificados suficientes para sugerir um match.",
        suggestions: []
      })
    }

    // Admins are unlimited, but the credit still counts usage per admin.
    const quota = await consumeAiQuota(supabase, "admin_waitlist_match")
    if (!quota.allowed) {
      return NextResponse.json({ error: "Limite mensal de IA atingido", quota }, { status: 429 })
    }

    const { result: matchResult, calls } = await aiMatchService.findOptimalMentors(supabase, reason.trim(), mentors as any[])
    after(() => recordAiCalls(supabase, "admin_waitlist_match", calls))

    // Anexa nome/e-mail do mentor a cada sugestão para exibir na tela do
    // admin sem uma segunda ida ao banco no front-end.
    const mentorById = new Map(mentors.map((m: any) => [m.id, m]))
    const suggestionsWithMentor = (matchResult.suggestions || []).map(s => ({
      ...s,
      mentor_name: mentorById.get(s.mentor_id)?.full_name || "Mentor",
      mentor_email: mentorById.get(s.mentor_id)?.email || null,
      mentor_title: mentorById.get(s.mentor_id)?.job_title || null
    }))

    return NextResponse.json({
      ...matchResult,
      suggestions: suggestionsWithMentor
    })
  } catch (error: any) {
    console.error("[API waiting-list/match] Erro:", error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}
