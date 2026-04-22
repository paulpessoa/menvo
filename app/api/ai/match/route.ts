
import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { groqService } from "@/lib/services/ai/groq.service"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { query } = await request.json()

    if (!query || query.length < 5) {
      return NextResponse.json({ error: "Sua dúvida está muito curta." }, { status: 400 })
    }

    // 1. Verificar autenticação (Opcional, mas recomendado para evitar spam)
    const { data: { user } } = await supabase.auth.getUser()

    // 2. Buscar contexto dos mentores (Apenas os públicos e verificados)
    // Primeiro, buscamos mentores que batem com as palavras-chave da dúvida para garantir que estejam no contexto
    const keywords = query.split(' ').filter((w: string) => w.length > 3)
    let keywordFilter = ''
    if (keywords.length > 0) {
      keywordFilter = keywords.map((k: string) => `full_name.ilike.%${k}%,job_title.ilike.%${k}%,bio.ilike.%${k}%`).join(',')
    }

    const { data: mentors } = await supabase
      .from('mentors_view')
      .select('id, full_name, job_title, mentor_skills, bio')
      .eq('is_public', true)
      .eq('verified', true)
      .order('created_at', { ascending: false })
      .limit(100) // Aumentamos para 100 para dar mais chances

    if (!mentors || mentors.length === 0) {
      return NextResponse.json({ 
        no_match: true, 
        const supabase = await createClient()
        const { query, debug } = await request.json()

        if (!query || query.length < 5) {
        ...
        // 3. Chamar o Groq para fazer o match
        const matchResult = await groqService.findOptimalMentors(query, mentors)

        // 4. Retornar dados (com debug se solicitado)
        const finalResponse = {
            ...matchResult,
            ...(debug ? { debug_context: mentors } : {})
        }

        // 5. Se não houve match ou se queremos trackear a demanda, salvamos no banco
        if (matchResult.no_match) {
          await supabase.from('ai_missing_demands').insert({
            user_id: user?.id || null,
            query_text: query,
            suggested_topics: matchResult.suggested_topics,
            matched_count: 0
          })
        } else {
           // Log da demanda mesmo com sucesso para saber o que as pessoas buscam
           await supabase.from('ai_missing_demands').insert({
            user_id: user?.id || null,
            query_text: query,
            suggested_topics: matchResult.suggested_topics,
            matched_count: matchResult.mentor_ids.length
          })
        }

        return NextResponse.json(finalResponse)

  } catch (error: any) {
    console.error("💥 Erro na API de AI Match:", error)
    return NextResponse.json({ error: "Erro interno no processamento de IA." }, { status: 500 })
  }
}
