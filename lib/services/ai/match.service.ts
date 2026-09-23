/**
 * AI Match Service
 * Handles intelligent matching of mentors based on user search queries,
 * resolved through the model registry (`lib/ai/models`, capability `rank`)
 * with fallback and metering built in, and a deterministic keyword match as
 * the last resort when no provider is available or every attempt fails.
 *
 * Returns, next to the result, one `AiCallRecord` per attempt so the caller
 * can meter cost — including attempts that failed and the keyword fallback.
 */
import { z } from "zod"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getStructuredModel, AiModelUnavailableError } from "@/lib/ai/models"
import type { AiCallRecord } from "@/lib/ai/metering"

const aiMatchResultSchema = z.object({
  suggestions: z
    .array(z.object({ mentor_id: z.string(), reason: z.string().default("") }))
    .default([]),
  global_justification: z.string().default(""),
  suggested_topics: z.array(z.string()).default([]),
  no_match: z.boolean().default(false)
})

export type AIMatchResult = z.infer<typeof aiMatchResultSchema>

export interface AIMatchRun {
  result: AIMatchResult
  calls: AiCallRecord[]
}

export interface MentorContextItem {
  id: string
  full_name: string
  job_title: string | null
  mentor_skills?: string[] | null
  expertise_areas?: string[] | null
  mentorship_topics?: string[] | null
  bio?: string | null
}

interface MentorSummary {
  id: string
  name: string
  title: string
  skills: string[]
  bio: string
}

/**
 * O modelo às vezes "inventa" um mentor_id que não é o valor exato do campo
 * `id` fornecido no contexto — por exemplo, uma versão simplificada do nome
 * (`"nayane_prudencio"`) em vez do UUID real. Isso passaria despercebido até
 * o front-end tentar buscar esse ID no banco: como o Postgres rejeita a
 * cláusula `.in()` inteira quando um valor não é um UUID válido, um único
 * ID alucinado derruba a exibição de TODOS os mentores sugeridos, mesmo os
 * que vieram certos. Filtramos aqui, na fronteira do serviço de IA, pra
 * nunca deixar um ID inventado sair — não importa qual provedor (OpenAI,
 * Groq ou o fallback determinístico) gerou o resultado.
 */
function sanitizeResult(result: AIMatchResult, validIds: Set<string>): AIMatchResult {
  const suggestions = result.suggestions.filter((s) => validIds.has(s.mentor_id))
  if (suggestions.length === 0 && result.suggestions.length > 0) {
    return {
      ...result,
      suggestions: [],
      no_match: true,
      global_justification:
        "Não conseguimos confirmar um mentor específico para essa busca no momento, mas novas conexões são adicionadas semanalmente."
    }
  }
  return { ...result, suggestions }
}

function keywordMatch(userQuery: string, mentors: MentorSummary[]): AIMatchResult {
  const queryTokens = userQuery.toLowerCase().split(/\s+/).filter((t) => t.length > 2)
  const matches: Array<{ mentor_id: string; reason: string; score: number }> = []

  for (const mentor of mentors) {
    let score = 0
    const matchedKeywords: string[] = []

    for (const token of queryTokens) {
      if (mentor.title.toLowerCase().includes(token)) {
        score += 3
        matchedKeywords.push(mentor.title)
      }
      const skillHits = mentor.skills.filter((s) => s.toLowerCase().includes(token))
      if (skillHits.length > 0) {
        score += 4
        matchedKeywords.push(...skillHits)
      }
      if (mentor.bio.toLowerCase().includes(token)) score += 1
    }

    if (score > 0) {
      matches.push({
        mentor_id: mentor.id,
        reason: `Experiência compatível com seus interesses: ${[...new Set(matchedKeywords)].slice(0, 3).join(", ") || mentor.title}.`,
        score
      })
    }
  }

  const topMatches = matches.sort((a, b) => b.score - a.score).slice(0, 3)

  if (topMatches.length === 0) {
    return {
      suggestions: [],
      global_justification: "Não encontramos mentores com correspondência exata para essa busca específica no momento.",
      suggested_topics: ["Tecnologia", "Carreira", "Liderança"],
      no_match: true
    }
  }

  return {
    suggestions: topMatches.map(({ mentor_id, reason }) => ({ mentor_id, reason })),
    global_justification: `Encontramos ${topMatches.length} mentores com habilidades alinhadas aos seus termos de busca.`,
    suggested_topics: queryTokens.slice(0, 3),
    no_match: false
  }
}

function buildPrompt(userQuery: string, mentorsSummary: MentorSummary[]): string {
  return `
Você é o Especialista em Conexões Ético da plataforma MENVO.
Sua missão é analisar os mentores disponíveis e sugerir os mais indicados para a dúvida do usuário: "${userQuery}"

MENTORES DISPONÍVEIS:
${JSON.stringify(mentorsSummary)}

REGRAS CRÍTICAS DE INTEGRIDADE:
1. RIGOR TÉCNICO: Se o usuário busca algo que NÃO EXISTE na lista de mentores (ex: médico, atleta profissional, astronauta) e não há mentores com essa expertise real, retorne "no_match": true.
2. NUNCA FORÇAR: Não sugira perfis aleatórios ou não correlacionados.
3. JUSTIFICATIVA HONESTA: Se "no_match" for true, em "global_justification", explique cordialmente que a rede Menvo ainda não possui especialistas específicos nessa área, mas que novas conexões são adicionadas semanalmente.
4. FOCO DE NEGÓCIO: Dê prioridade a Carreira, Tecnologia, Programação, Produto, Design, Dados, Gestão e Educação.
5. Retorne NO MÁXIMO 4 mentores recomendados.
6. ID EXATO: o campo "mentor_id" de cada sugestão deve ser IDÊNTICO, caractere por caractere, ao valor do campo "id" do mentor correspondente na lista acima (um UUID, ex: "0737122a-0579-4981-9802-41883d6563a3"). NUNCA invente, abrevie ou crie uma versão do nome como id — copie o "id" exatamente como está na lista.

FORMATO JSON OBRIGATÓRIO:
{
  "suggestions": [
    { "mentor_id": "id-do-mentor", "reason": "Justificativa curta e direta citando a afinidade com a dúvida do usuário." }
  ],
  "global_justification": "Frase resumida explicando os resultados encontrados.",
  "suggested_topics": ["Tema 1", "Tema 2"],
  "no_match": false
}
`
}

export const aiMatchService = {
  /**
   * Finds the best mentor matches for a given query against available mentors
   * context. `supabase` is the caller's session client, used only to resolve
   * the `rank` capability's model chain (`ai_model_config`, RLS applies) —
   * no domain query happens here.
   */
  async findOptimalMentors(
    supabase: SupabaseClient,
    userQuery: string,
    mentorsContext: MentorContextItem[]
  ): Promise<AIMatchRun> {
    const validIds = new Set(mentorsContext.map((m) => m.id))
    const mentorsSummary: MentorSummary[] = mentorsContext.map((m) => ({
      id: m.id,
      name: m.full_name,
      title: m.job_title || "Mentor",
      skills: [...new Set([...(m.mentor_skills ?? []), ...(m.expertise_areas ?? []), ...(m.mentorship_topics ?? [])])],
      bio: m.bio?.substring(0, 160) || ""
    }))

    const calls: AiCallRecord[] = []

    try {
      const model = await getStructuredModel<AIMatchResult>(supabase, "rank", aiMatchResultSchema, {
        onCall: (record) => calls.push(record)
      })
      const result = await model.invoke(buildPrompt(userQuery, mentorsSummary))
      return { result: sanitizeResult(result, validIds), calls }
    } catch (err) {
      if (!(err instanceof AiModelUnavailableError)) {
        console.warn("[MatchService] all model attempts failed, using keyword fallback:", err instanceof Error ? err.message : err)
      }
      console.info("[MatchService] Using deterministic keyword matching fallback")
      calls.push({
        provider: "local",
        model: "keyword",
        inputTokens: 0,
        outputTokens: 0,
        cachedInputTokens: 0,
        latencyMs: 0,
        status: "fallback"
      })
      return { result: keywordMatch(userQuery, mentorsSummary), calls }
    }
  }
}
