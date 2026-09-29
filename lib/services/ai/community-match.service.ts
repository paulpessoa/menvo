/**
 * Community AI Match Service
 * Same shape as `match.service.ts` but pointed the other way: a mentor
 * describes who they'd like to help, and the model picks matching mentee /
 * learner profiles from the Community wall instead of mentors from the
 * catalog. Kept as its own small file rather than a generic parameter on
 * `aiMatchService` — the prompt, the id field name and the sanitize rules
 * differ enough that sharing code would mean branching inside every helper.
 */
import { z } from "zod"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getStructuredModel, AiModelUnavailableError } from "@/lib/ai/models"
import type { AiCallRecord } from "@/lib/ai/metering"

const communityMatchResultSchema = z.object({
  suggestions: z
    .array(z.object({ profile_id: z.string(), reason: z.string().default("") }))
    .default([]),
  global_justification: z.string().default(""),
  suggested_topics: z.array(z.string()).default([]),
  no_match: z.boolean().default(false)
})

export type CommunityMatchResult = z.infer<typeof communityMatchResultSchema>

export interface CommunityMatchRun {
  result: CommunityMatchResult
  calls: AiCallRecord[]
}

export interface MenteeContextItem {
  id: string
  full_name: string
  job_title: string | null
  bio?: string | null
  expertise_areas?: string[] | null
}

interface MenteeSummary {
  id: string
  name: string
  title: string
  interests: string[]
  bio: string
}

/** Same "never let a hallucinated id out" guard as the mentor match service. */
function sanitizeResult(result: CommunityMatchResult, validIds: Set<string>): CommunityMatchResult {
  const suggestions = result.suggestions.filter((s) => validIds.has(s.profile_id))
  if (suggestions.length === 0 && result.suggestions.length > 0) {
    return {
      ...result,
      suggestions: [],
      no_match: true,
      global_justification:
        "Não conseguimos confirmar um perfil específico para esse pedido no momento, mas novos membros chegam toda semana."
    }
  }
  return { ...result, suggestions }
}

function keywordMatch(userQuery: string, mentees: MenteeSummary[]): CommunityMatchResult {
  const queryTokens = userQuery.toLowerCase().split(/\s+/).filter((t) => t.length > 2)
  const matches: Array<{ profile_id: string; reason: string; score: number }> = []

  for (const mentee of mentees) {
    let score = 0
    const matchedKeywords: string[] = []

    for (const token of queryTokens) {
      if (mentee.title.toLowerCase().includes(token)) {
        score += 3
        matchedKeywords.push(mentee.title)
      }
      const interestHits = mentee.interests.filter((s) => s.toLowerCase().includes(token))
      if (interestHits.length > 0) {
        score += 4
        matchedKeywords.push(...interestHits)
      }
      if (mentee.bio.toLowerCase().includes(token)) score += 1
    }

    if (score > 0) {
      matches.push({
        profile_id: mentee.id,
        reason: `Interesses compatíveis com o que você quer ajudar: ${[...new Set(matchedKeywords)].slice(0, 3).join(", ") || mentee.title}.`,
        score
      })
    }
  }

  const topMatches = matches.sort((a, b) => b.score - a.score).slice(0, 3)

  if (topMatches.length === 0) {
    return {
      suggestions: [],
      global_justification: "Não encontramos membros com correspondência exata para essa busca específica no momento.",
      suggested_topics: ["Tecnologia", "Carreira", "Liderança"],
      no_match: true
    }
  }

  return {
    suggestions: topMatches.map(({ profile_id, reason }) => ({ profile_id, reason })),
    global_justification: `Encontramos ${topMatches.length} pessoas na comunidade com objetivos alinhados aos seus termos de busca.`,
    suggested_topics: queryTokens.slice(0, 3),
    no_match: false
  }
}

function buildPrompt(userQuery: string, menteesSummary: MenteeSummary[]): string {
  return `
Você é o Especialista em Conexões Ético da plataforma MENVO.
Um mentor descreveu quem ele gostaria de ajudar: "${userQuery}"
Sua missão é analisar os membros da comunidade (mentorados) abaixo e sugerir os mais alinhados a esse perfil.

MEMBROS DA COMUNIDADE:
${JSON.stringify(menteesSummary)}

REGRAS CRÍTICAS DE INTEGRIDADE:
1. RIGOR TÉCNICO: Se a descrição não corresponde a NENHUM membro da lista, retorne "no_match": true.
2. NUNCA FORÇAR: Não sugira perfis aleatórios ou não correlacionados.
3. JUSTIFICATIVA HONESTA: Se "no_match" for true, em "global_justification", explique cordialmente que ainda não há membros com esse perfil, mas que novas pessoas se cadastram toda semana.
4. Retorne NO MÁXIMO 4 membros recomendados.
5. ID EXATO: o campo "profile_id" de cada sugestão deve ser IDÊNTICO, caractere por caractere, ao valor do campo "id" do membro correspondente na lista acima (um UUID). NUNCA invente, abrevie ou crie uma versão do nome como id.

FORMATO JSON OBRIGATÓRIO:
{
  "suggestions": [
    { "profile_id": "id-do-membro", "reason": "Justificativa curta e direta citando a afinidade com o pedido do mentor." }
  ],
  "global_justification": "Frase resumida explicando os resultados encontrados.",
  "suggested_topics": ["Tema 1", "Tema 2"],
  "no_match": false
}
`
}

export const communityMatchService = {
  /**
   * Finds the best mentee/learner matches for a mentor's description of who
   * they want to help. `supabase` is only used to resolve the `rank`
   * capability's model chain (same as `aiMatchService`) — no domain query
   * happens here.
   */
  async findBestMentees(
    supabase: SupabaseClient,
    userQuery: string,
    menteesContext: MenteeContextItem[]
  ): Promise<CommunityMatchRun> {
    const validIds = new Set(menteesContext.map((m) => m.id))
    const menteesSummary: MenteeSummary[] = menteesContext.map((m) => ({
      id: m.id,
      name: m.full_name,
      title: m.job_title || "Mentorado",
      interests: [...new Set(m.expertise_areas ?? [])],
      bio: m.bio?.substring(0, 160) || ""
    }))

    const calls: AiCallRecord[] = []

    try {
      const model = await getStructuredModel<CommunityMatchResult>(
        supabase,
        "rank",
        communityMatchResultSchema,
        { onCall: (record) => calls.push(record) }
      )
      const result = await model.invoke(buildPrompt(userQuery, menteesSummary))
      return { result: sanitizeResult(result, validIds), calls }
    } catch (err) {
      if (!(err instanceof AiModelUnavailableError)) {
        console.warn("[CommunityMatchService] all model attempts failed, using keyword fallback:", err instanceof Error ? err.message : err)
      }
      console.info("[CommunityMatchService] Using deterministic keyword matching fallback")
      calls.push({
        provider: "local",
        model: "keyword",
        inputTokens: 0,
        outputTokens: 0,
        cachedInputTokens: 0,
        latencyMs: 0,
        status: "fallback"
      })
      return { result: keywordMatch(userQuery, menteesSummary), calls }
    }
  }
}
