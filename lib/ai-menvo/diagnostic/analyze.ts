/**
 * Quiz analysis (ADR 0004 §7.3, decision D8 = option A): the same prompt and
 * deterministic fallback that used to live in
 * `supabase/functions/analyze-quiz` (gpt-3.5-turbo, service_role,
 * unauthenticated, unmetered), now resolved through the model registry
 * (`lib/ai/models`, capability `analyze`) and called from
 * `POST /api/quiz/[id]/analyze`. Lives in `lib/ai-menvo/` (not `lib/ai/`)
 * because it's Menvo domain content — the prompt, the fallback heuristic and
 * the mentor-matching logic are specific to this product (AI_PLATFORM_PLAN.md
 * §1 principle 6).
 */
import { z } from "zod"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getStructuredModel, AiModelUnavailableError } from "@/lib/ai/models"
import type { AiCallRecord } from "@/lib/ai/metering"

// Every field required and non-nullable, because both models in the
// `analyze` chain reject the alternatives (verified with real calls,
// 2026-09-23): OpenAI's strict Structured Outputs (gpt-5-mini) refuses
// `ZodDefault` before sending the request, and Gemini refuses `.nullable()`
// (`type: ["string","null"]` → 400). "Absent" is an empty string
// (mentor_nome) or an empty array; the results page treats "" as no name.
export const quizAnalysisSchema = z.object({
  precisa_refazer: z.boolean(),
  titulo_personalizado: z.string(),
  resumo_motivador: z.string(),
  mentores_sugeridos: z.array(
    z.object({
      tipo: z.string(),
      razao: z.string(),
      disponivel: z.boolean(),
      mentor_nome: z.string()
    })
  ),
  conselhos_praticos: z.array(z.string()),
  proximos_passos: z.array(z.string()),
  areas_desenvolvimento: z.array(z.string()),
  mensagem_final: z.string(),
  potencial_mentor: z.boolean(),
  areas_vida_pessoal: z.array(z.string())
})

export type QuizAnalysisResult = z.infer<typeof quizAnalysisSchema>

/** The quiz answers `claim_quiz_analysis` returns — exactly what the prompt
 * needs, nothing more (no email, no linkedin_url). */
export interface QuizAnswers {
  name: string
  career_moment: string
  mentorship_experience: string
  development_areas: string[]
  current_challenge: string
  future_vision: string
  share_knowledge: string
  personal_life_help: string
}

export interface AnalysisMentor {
  id: string
  full_name: string | null
  bio: string | null
  job_title: string | null
  company: string | null
  expertise_areas: string[] | null
  mentor_skills: string[] | null
  mentorship_topics: string[] | null
  availability_status: string | null
  average_rating: number | null
  total_reviews: number | null
  total_sessions: number | null
}

function buildPrompt(answers: QuizAnswers, mentors: AnalysisMentor[]): string {
  const mentorsSection =
    mentors.length > 0
      ? mentors
          .map(
            (m) => `- ${m.full_name} (${m.job_title} na ${m.company}):
  Expertise: ${m.expertise_areas?.join(", ") || "N/A"}
  Tópicos de Mentoria: ${m.mentorship_topics?.join(", ") || "N/A"}
  Rating: ${m.average_rating ?? "N/A"}/5 (${m.total_reviews ?? 0} avaliações, ${m.total_sessions ?? 0} sessões)
  Status: ${m.availability_status}`
          )
          .join("\n\n")
      : "Nenhum mentor cadastrado no momento."

  return `Analise as respostas do questionário abaixo e crie uma análise personalizada, criativa e motivadora.

RESPOSTAS DO PARTICIPANTE:
- Nome: ${answers.name}
- Momento de carreira: ${answers.career_moment}
- Experiência com mentoria: ${answers.mentorship_experience}
- Áreas de desenvolvimento: ${answers.development_areas.join(", ")}
- Desafio profissional: ${answers.current_challenge}
- Visão de futuro (2 anos): ${answers.future_vision}
- Interesse em compartilhar conhecimento: ${answers.share_knowledge}
- Desafios na vida pessoal: ${answers.personal_life_help}

MENTORES DISPONÍVEIS NA PLATAFORMA:
${mentorsSection}

INSTRUÇÕES:
1. PRIMEIRO: Avalie a qualidade e coerência das respostas
   - Se as respostas forem muito vagas, incoerentes, ou claramente não sérias (ex: "não sei", "talvez", respostas de uma palavra, textos sem sentido)
   - Retorne uma mensagem educativa pedindo mais atenção e sugerindo refazer o questionário
   - Use o campo "precisa_refazer" como true nestes casos

2. Se as respostas forem adequadas, crie uma análise calorosa, profissional e motivadora
3. Sugira 2-3 tipos de mentores baseados nas áreas de interesse:
   - REGRA CRÍTICA: NUNCA invente nomes de mentores fictícios.
   - Em "mentor_nome", use ESTRITAMENTE o nome de um mentor real presente na lista "MENTORES DISPONÍVEIS NA PLATAFORMA" acima, caso haja sinergia com a área.
   - Se não houver nenhum mentor na lista acima compatível com aquela área (ou se a lista estiver vazia), use obrigatoriamente "mentor_nome": "" (texto vazio) e "disponivel": false.
4. Dê 2-3 conselhos práticos e acionáveis
5. Identifique se a pessoa tem potencial para ser mentora (baseado na resposta sobre compartilhar conhecimento)
6. Sugira áreas de desenvolvimento na vida pessoal baseado nos desafios mencionados

Responda em português brasileiro, com JSON válido no formato do schema fornecido.`
}

function hasVagueOrGenericResponses(answers: QuizAnswers): boolean {
  const challenge = (answers.current_challenge || "").trim().toLowerCase()
  const vision = (answers.future_vision || "").trim().toLowerCase()

  // Challenge and vision are the primary signals. Very brief answers (< 6 chars) are considered vague.
  const hasVagueResponses = challenge.length < 6 || vision.length < 6

  const genericPhrases = [
    "não sei",
    "nao sei",
    "nada",
    "nenhum",
    "nenhuma",
    "sei lá",
    "sei la",
    "...",
    "teste",
    "asdf"
  ]

  const hasGenericResponses = genericPhrases.some(
    (term) => challenge === term || vision === term
  )

  return hasVagueResponses || hasGenericResponses
}

/**
 * Deterministic analysis, used only when the model registry has no
 * available provider or every attempt in the chain fails — the same
 * heuristic `supabase/functions/analyze-quiz` used as its fallback.
 */
export function fallbackAnalysis(answers: QuizAnswers, mentors: AnalysisMentor[]): QuizAnalysisResult {
  if (hasVagueOrGenericResponses(answers)) {
    return {
      precisa_refazer: true,
      titulo_personalizado: "Que tal tentar novamente?",
      resumo_motivador:
        "Notamos que suas respostas foram muito breves ou vagas. Para uma análise mais precisa e útil, recomendamos refazer o questionário com mais detalhes e reflexão sobre seus objetivos profissionais.",
      mentores_sugeridos: [],
      conselhos_praticos: [
        "Reflita mais profundamente sobre seus desafios atuais",
        "Pense em objetivos específicos para os próximos 2 anos",
        "Considere áreas onde você gostaria de crescer profissionalmente"
      ],
      proximos_passos: [
        "Refaça o questionário com respostas mais detalhadas",
        "Dedique tempo para pensar sobre seus objetivos de carreira"
      ],
      areas_desenvolvimento: answers.development_areas || [],
      mensagem_final:
        "Uma boa análise precisa de respostas thoughtful. Tente novamente quando estiver pronto para compartilhar mais sobre seus desafios e objetivos!",
      potencial_mentor: false,
      areas_vida_pessoal: []
    }
  }

  const matchedMentors = mentors
    .filter((mentor) => {
      const mentorAreas = [
        ...(mentor.expertise_areas || []),
        ...(mentor.mentorship_topics || []),
        ...(mentor.mentor_skills || [])
      ].map((area) => area.toLowerCase())

      return answers.development_areas.some((devArea) =>
        mentorAreas.some((mentorArea) => mentorArea.includes(devArea.toLowerCase()) || devArea.toLowerCase().includes(mentorArea))
      )
    })
    .slice(0, 3)

  const mentoresSugeridos =
    matchedMentors.length > 0
      ? matchedMentors.map((mentor) => ({
          tipo: `${mentor.full_name} - ${mentor.job_title}`,
          razao: `${mentor.bio?.substring(0, 100)}... | Expertise: ${mentor.expertise_areas?.slice(0, 2).join(", ")} | Rating: ${mentor.average_rating ?? "N/A"}/5`,
          disponivel: mentor.availability_status === "available",
          mentor_nome: mentor.full_name ?? ""
        }))
      : [
          {
            tipo: "Mentor de Carreira",
            razao: "Para te ajudar a planejar seus próximos passos profissionais e definir objetivos claros",
            disponivel: false,
            mentor_nome: ""
          },
          {
            tipo: "Mentor de Desenvolvimento Técnico",
            razao: "Para desenvolver suas habilidades técnicas e se manter atualizado no mercado",
            disponivel: false,
            mentor_nome: ""
          },
          {
            tipo: "Mentor de Liderança",
            razao: "Para desenvolver suas soft skills e capacidades de liderança",
            disponivel: false,
            mentor_nome: ""
          }
        ]

  const potencialMentor =
    answers.share_knowledge.includes("sim") || answers.share_knowledge.includes("ja-faco")

  return {
    precisa_refazer: false,
    titulo_personalizado: "Seu Perfil de Crescimento Profissional",
    resumo_motivador:
      "Você demonstra clareza sobre seus objetivos e está no caminho certo para alcançá-los. Continue investindo em seu desenvolvimento!",
    mentores_sugeridos: mentoresSugeridos,
    conselhos_praticos: [
      "Defina metas específicas e mensuráveis para os próximos 3 meses",
      "Busque networking ativo na sua área de interesse",
      "Invista em aprendizado contínuo através de cursos e mentorias"
    ],
    proximos_passos: [
      "Cadastre-se na plataforma MENVO para conectar com mentores",
      "Identifique 3 habilidades prioritárias para desenvolver",
      "Participe de comunidades e eventos da sua área"
    ],
    areas_desenvolvimento: answers.development_areas.slice(0, 3),
    mensagem_final: "Você tem um grande potencial! Continue buscando crescimento e não hesite em pedir ajuda quando precisar.",
    potencial_mentor: potencialMentor,
    areas_vida_pessoal: ["Equilíbrio vida-trabalho", "Desenvolvimento de hobbies"]
  }
}

/**
 * Sanitizes suggested mentors against real platform mentors.
 *
 * Why: LLMs frequently hallucinate fictitious names (e.g. "Ana Santos", "Pedro Oliveira")
 * when attempting to match user needs, even with explicit negative prompt constraints.
 * This function guarantees that any suggested mentor whose name does not exactly match
 * an active platform mentor has their name cleared to "" and their availability set to false.
 * For genuine mentors, it reflects their true availability status.
 *
 * @param analysis - The raw analysis result produced by the model or fallback
 * @param realMentors - The list of actual platform mentors provided as context
 * @returns The sanitized analysis result free of hallucinated mentor names
 */
export function sanitizeAnalysisMentors(
  analysis: QuizAnalysisResult,
  realMentors: AnalysisMentor[]
): QuizAnalysisResult {
  const mentorMap = new Map<string, AnalysisMentor>()
  for (const m of realMentors) {
    if (m.full_name) {
      mentorMap.set(m.full_name.trim().toLowerCase(), m)
    }
  }

  const sanitizedMentores = (analysis.mentores_sugeridos || []).map((item) => {
    const rawName = item.mentor_nome?.trim()
    if (!rawName) {
      return {
        ...item,
        mentor_nome: "",
        disponivel: false
      }
    }

    const matched = mentorMap.get(rawName.toLowerCase())
    if (!matched) {
      // Hallucinated mentor name — purge to avoid showing non-existent users
      return {
        ...item,
        mentor_nome: "",
        disponivel: false
      }
    }

    return {
      ...item,
      mentor_nome: matched.full_name || rawName,
      disponivel: matched.availability_status === "available"
    }
  })

  return {
    ...analysis,
    mentores_sugeridos: sanitizedMentores
  }
}

export interface AnalyzeQuizOptions {
  onCall: (record: AiCallRecord) => void
}

export interface AnalyzeQuizRun {
  analysis: QuizAnalysisResult
  usedFallback: boolean
}

/**
 * Runs the `analyze` capability against the quiz answers, with the same
 * deterministic fallback the old Edge Function had. `supabase` only
 * resolves the model chain (`ai_model_config`) — this function never reads
 * or writes `quiz_responses` itself (the route does, through
 * `claim_quiz_analysis`/`save_quiz_analysis`).
 */
export async function analyzeQuiz(
  supabase: SupabaseClient,
  answers: QuizAnswers,
  mentors: AnalysisMentor[],
  opts: AnalyzeQuizOptions
): Promise<AnalyzeQuizRun> {
  try {
    const model = await getStructuredModel<QuizAnalysisResult>(supabase, "analyze", quizAnalysisSchema, {
      onCall: opts.onCall
    })
    const rawAnalysis = await model.invoke(buildPrompt(answers, mentors))
    const analysis = sanitizeAnalysisMentors(rawAnalysis, mentors)
    return { analysis, usedFallback: false }
  } catch (err) {
    if (!(err instanceof AiModelUnavailableError)) {
      console.warn("[analyzeQuiz] model attempts failed, using deterministic fallback:", err instanceof Error ? err.message : err)
    }
    const fallback = sanitizeAnalysisMentors(fallbackAnalysis(answers, mentors), mentors)
    return { analysis: fallback, usedFallback: true }
  }
}
