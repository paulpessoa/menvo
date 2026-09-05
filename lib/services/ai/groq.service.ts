/**
 * AI Match Service
 * Handles intelligent matching of mentors based on user search queries,
 * utilizing OpenAI (gpt-4o-mini) as primary provider with fallback to Groq
 * and deterministic keyword matching. Uses native fetch for zero-dependency portability.
 */

export interface AIMatchResult {
  suggestions: Array<{
    mentor_id: string
    reason: string
  }>
  global_justification: string
  suggested_topics: string[]
  no_match: boolean
}

export interface MentorContextItem {
  id: string
  full_name: string
  job_title: string | null
  mentor_skills?: string[] | null
  bio?: string | null
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY
const GROQ_API_KEY = process.env.GROQ_API_KEY

export const aiMatchService = {
  /**
   * Finds the best mentor matches for a given query against available mentors context.
   */
  async findOptimalMentors(
    userQuery: string,
    mentorsContext: MentorContextItem[]
  ): Promise<AIMatchResult> {
    const mentorsSummary = mentorsContext.map((m) => ({
      id: m.id,
      name: m.full_name,
      title: m.job_title || "Mentor",
      skills: m.mentor_skills || [],
      bio: m.bio?.substring(0, 160) || ""
    }))

    const prompt = `
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

    // Strategy 1: OpenAI (gpt-4o-mini)
    if (OPENAI_API_KEY) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "Você é um assistente técnico que retorna estritamente JSON válido." },
              { role: "user", content: prompt }
            ],
            temperature: 0.2,
            response_format: { type: "json_object" }
          }),
          signal: AbortSignal.timeout(10000)
        })

        if (response.ok) {
          const data = await response.json()
          const content = data?.choices?.[0]?.message?.content
          if (content) {
            const result = JSON.parse(content)
            return result as AIMatchResult
          }
        } else {
          const errText = await response.text()
          console.warn("[AIMatchService] OpenAI request non-200:", response.status, errText)
        }
      } catch (openAiError: any) {
        console.warn("[AIMatchService] OpenAI request failed, attempting fallback:", openAiError?.message)
      }
    }

    // Strategy 2: Groq (if configured and OpenAI failed or wasn't provided)
    if (GROQ_API_KEY) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-20b",
            messages: [
              { role: "system", content: "Você é um assistente técnico que retorna estritamente JSON válido." },
              { role: "user", content: prompt }
            ],
            temperature: 0.2,
            response_format: { type: "json_object" }
          }),
          signal: AbortSignal.timeout(10000)
        })

        if (response.ok) {
          const data = await response.json()
          const content = data?.choices?.[0]?.message?.content
          if (content) {
            const result = JSON.parse(content)
            return result as AIMatchResult
          }
        } else {
          const errText = await response.text()
          console.warn("[AIMatchService] Groq request non-200:", response.status, errText)
        }
      } catch (groqError: any) {
        console.warn("[AIMatchService] Groq request failed:", groqError?.message)
      }
    }

    // Strategy 3: Deterministic keyword fallback (prevents 500 crashes)
    console.info("[AIMatchService] Using deterministic keyword matching fallback")
    const queryLower = userQuery.toLowerCase()
    const queryTokens = queryLower.split(/\s+/).filter((t) => t.length > 2)

    const matches: Array<{ mentor_id: string; reason: string; score: number }> = []

    for (const mentor of mentorsSummary) {
      let score = 0
      const matchedKeywords: string[] = []

      for (const token of queryTokens) {
        if (mentor.title.toLowerCase().includes(token)) {
          score += 3
          matchedKeywords.push(mentor.title)
        }
        if (mentor.skills.some((s: string) => s.toLowerCase().includes(token))) {
          score += 4
          matchedKeywords.push(...mentor.skills.filter((s: string) => s.toLowerCase().includes(token)))
        }
        if (mentor.bio.toLowerCase().includes(token)) {
          score += 1
        }
      }

      if (score > 0) {
        matches.push({
          mentor_id: mentor.id,
          reason: `Experiência compatível com seus interesses: ${[...new Set(matchedKeywords)].slice(0, 3).join(", ") || mentor.title}.`,
          score
        })
      }
    }

    matches.sort((a, b) => b.score - a.score)
    const topMatches = matches.slice(0, 3)

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
}

// Backwards compatibility alias
export const groqService = aiMatchService
