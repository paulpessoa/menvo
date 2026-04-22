import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { groqService, type AIMatchResult } from "@/lib/services/ai/groq.service"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { query, debug } = await request.json()

    if (!query || query.length < 5) {
      return NextResponse.json(
        { error: "Sua dúvida está muito curta." },
        { status: 400 }
      )
    }

    // 1. Verificar autenticação
    const {
      data: { user }
    } = await supabase.auth.getUser()
// 2. Buscar contexto dos mentores
let queryBuilder = supabase
  .from('mentors_view')
  .select('id, full_name, job_title, mentor_skills, bio')
  .order('created_at', { ascending: false })
  .limit(100)

// Em produção, exigimos verificação. No Lab (debug), liberamos para teste.
if (!debug) {
  queryBuilder = queryBuilder.eq('verified', true)
}

const { data: mentors } = await queryBuilder

if (!mentors || mentors.length === 0) {
  return NextResponse.json({ 
    no_match: true, 
    justification: `Ainda não temos mentores ${!debug ? 'verificados ' : ''}disponíveis na plataforma.` 
  })
}


    // 3. Chamar o Groq para fazer o match
    const matchResult: AIMatchResult = await groqService.findOptimalMentors(query, mentors)

    // 4. Preparar resposta (incluindo debug se solicitado)
    const finalResponse = {
      ...matchResult,
      ...(debug ? { debug_context: mentors } : {})
    }

    // 5. Trackear a demanda no banco
    await supabase.from('ai_missing_demands').insert({
      user_id: user?.id || null,
      query_text: query,
      suggested_topics: matchResult.suggested_topics,
      matched_count: matchResult.suggestions?.length || 0
    } as any)


    return NextResponse.json(finalResponse)
  } catch (error: any) {
    console.error("💥 Erro na API de AI Match:", error)
    return NextResponse.json(
      { error: "Erro interno no processamento de IA." },
      { status: 500 }
    )
  }
}
