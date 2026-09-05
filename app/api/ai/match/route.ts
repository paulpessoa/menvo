import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { aiMatchService, type AIMatchResult } from "@/lib/services/ai/groq.service"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { query, debug } = await request.json()

    if (!query || query.trim().length < 5) {
      return NextResponse.json(
        { error: "Sua dúvida está muito curta. Descreva melhor o que você procura." },
        { status: 400 }
      )
    }

    // 1. Contexto do usuário (opcional para tracking)
    const {
      data: { user }
    } = await supabase.auth.getUser()

    // 2. Buscar mentores disponíveis
    let queryBuilder = supabase
      .from("mentors_view")
      .select("id, full_name, job_title, mentor_skills, bio")
      .order("created_at", { ascending: false })
      .limit(100)

    if (!debug) {
      queryBuilder = queryBuilder.eq("verified", true)
    }

    let { data: mentors } = await queryBuilder

    // Fallback: se nenhum mentor verificado for retornado, consulta mentores gerais ativos
    if (!mentors || mentors.length === 0) {
      const fallbackQuery = await supabase
        .from("mentors_view")
        .select("id, full_name, job_title, mentor_skills, bio")
        .limit(100)
      mentors = fallbackQuery.data || []
    }

    if (!mentors || mentors.length === 0) {
      return NextResponse.json({
        no_match: true,
        global_justification: "Ainda não temos mentores cadastrados disponíveis na plataforma.",
        suggestions: [],
        suggested_topics: ["Carreira", "Tecnologia", "Liderança"]
      })
    }

    // 3. Processar match com IA (OpenAI gpt-4o-mini com fallback resiliente)
    const matchResult: AIMatchResult = await aiMatchService.findOptimalMentors(
      query.trim(),
      mentors as any[]
    )

    // 4. Preparar resposta
    const finalResponse = {
      ...matchResult,
      ...(debug ? { debug_context: mentors } : {})
    }

    // 5. Trackear demanda de busca de forma assíncrona (não bloqueante)
    try {
      await supabase.from("ai_missing_demands").insert({
        user_id: user?.id || null,
        query_text: query.trim(),
        suggested_topics: matchResult.suggested_topics || [],
        matched_count: matchResult.suggestions?.length || 0
      } as any)
    } catch (trackError) {
      console.warn("[AIMatchRoute] Non-blocking tracking error:", trackError)
    }

    return NextResponse.json(finalResponse)
  } catch (error: any) {
    console.error("💥 Erro na API de AI Match:", error)
    return NextResponse.json(
      { error: "Erro interno no processamento de IA." },
      { status: 500 }
    )
  }
}
