import { createAgent, modelFallbackMiddleware } from "langchain"
import { tool } from "@langchain/core/tools"
import { SystemMessage } from "@langchain/core/messages"
import { SupabaseClient, type User } from "@supabase/supabase-js"
import { getAgentModels } from "@/lib/ai/models"
import type { AiCallRecord } from "@/lib/ai/metering"
import {
  assistantTools,
  searchMentorsInput,
  getMentorAvailabilityInput,
  explainHowItWorksInput,
  saveFeedbackInput,
  getMyAppointmentsInput,
  getPendingEvaluationsInput,
  getMentorRequestsInput
} from "@/lib/services/assistant/tools"

export interface GetAssistantAgentOptions {
  /** Receives one AiCallRecord per model attempt (primary + every fallback
   * try), success or failure — ADR 0004 §6. */
  onCall: (record: AiCallRecord) => void
}

function buildSystemPrompt(role: "mentee" | "mentor" | "admin", firstName: string): string {
  let roleGuidance = ""
  if (role === "mentor") {
    roleGuidance = `
PAPEL DO USUÁRIO ATUAL: MENTOR (${firstName})
- O usuário é um MENTOR voluntário na Menvo.
- Priorize ajudá-lo na gestão de suas mentorias, visualização de solicitações pendentes e agenda.
- Se ele perguntar sobre suas mentorias ou agenda, use "getMyAppointments".
- Se ele perguntar sobre solicitações pendentes de alunos/mentorados, use "getMentorRequests".
- Lembre-se: Mentores NÃO avaliam mentorados na plataforma Menvo (a avaliação de feedback é exclusiva dos mentorados).
- Seja encorajador e valorize o trabalho voluntário dele.`
  } else if (role === "admin") {
    roleGuidance = `
PAPEL DO USUÁRIO ATUAL: ADMINISTRADOR (${firstName})
- O usuário é um ADMINISTRADOR da plataforma Menvo.
- Ele tem visão global, podendo consultar catálogo, mentorias e solicitações.
- Mantenha respostas executivas, técnicas e diretas.`
  } else {
    // Mentee
    roleGuidance = `
PAPEL DO USUÁRIO ATUAL: MENTORADO (${firstName})
- O usuário está buscando mentoria e orientação de carreira.
- Se ele expressar um objetivo claro (ex: transição de carreira, entrevistas, dados, IA), CHAME IMEDIATAMENTE a ferramenta "searchMentors". Não pergunte permissão.
- Se ele perguntar sobre suas mentorias agendadas, use "getMyAppointments".
- Se ele perguntar se tem mentorias para avaliar ou pendências, use "getPendingEvaluations".
- Reforce sempre que "é bom conversar para abrir a mente" e que a mentoria na Menvo é 100% gratuita.
- Ao citar mentores encontrados, NÃO liste detalhes completos no texto porque cards visuais interativos aparecerão automaticamente. Cite apenas os nomes e a razão da recomendação.`
  }

  return `Você é o Copiloto da Menvo (uma plataforma brasileira e gratuita de mentorias 1-a-1). Você NÃO tem um nome humano.
Seu objetivo é apoiar ${firstName} de acordo com suas necessidades na Menvo.

${roleGuidance}

GUARDRAILS E LIMITES (ESTRITAMENTE OBRIGATÓRIO):
- RECUSE-SE, com educação, a responder sobre qualquer tópico que não seja carreira, mentoria, tecnologia, negócios, design, dados ou sobre a Menvo. (Ex: se perguntarem sobre receitas, política, etc., diga que você só pode ajudar com temas de carreira e mentoria).
- NÃO USE EMOJIS nas suas respostas sob nenhuma circunstância.
- SEJA EXTREMAMENTE BREVE E DIRETO. Evite parágrafos longos. Responda em no máximo 2-3 frases curtas. Economize tokens e vá direto ao ponto.
- Se não souber informações sobre mentores, use a ferramenta de busca ("searchMentors"). Não invente perfis. IMPORTANTE: Se a busca não retornar resultados úteis ou retornar vazio, NÃO TENTE realizar a busca novamente em loop. Informe imediatamente ao usuário e ofereça outra alternativa.
- Para horários de um mentor específico, use "getMentorAvailability" (exige o slug).
- Para dúvidas sobre a plataforma, use "explainHowItWorks".
- IMPORTANTE: Após usar uma ferramenta e receber o resultado, formule a resposta final para o usuário e encerre a sua vez. NÃO chame a mesma ferramenta repetidas vezes em loop.

FEEDBACK:
- Ao fim de uma conversa ou quando resolver o problema do usuário, peça a ele um feedback sobre o seu atendimento. Peça para ele responder no chat dando uma nota de 1 a 5 e um comentário.
- Se o usuário enviar um feedback (nota e comentário), você DEVE obrigatoriamente usar a ferramenta "saveFeedback" para salvar no banco de dados e agradecê-lo em seguida.`
}

/**
 * Builds the role-aware assistant agent for one request, resolving the `converse`
 * capability through the model registry (`lib/ai/models`) with fallback.
 *
 * Configures role-specific tools (RBAC) and personalized system prompt.
 */
export async function getAssistantAgent(
  supabase: SupabaseClient,
  userOrOpts: User | { id: string } | GetAssistantAgentOptions,
  maybeOpts?: GetAssistantAgentOptions
) {
  let user: User | { id: string } | undefined
  let opts: GetAssistantAgentOptions

  if ("onCall" in userOrOpts) {
    opts = userOrOpts
    user = undefined
  } else {
    user = userOrOpts
    opts = maybeOpts || { onCall: () => {} }
  }

  const { primary, fallbacks } = await getAgentModels(supabase, "converse", { onCall: opts.onCall })

  // 1. Resolve user profile and role
  let role: "mentee" | "mentor" | "admin" = "mentee"
  let firstName = "colega"

  if (user?.id) {
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id)
      .returns<{ roles: { name: string } | null }[]>()

    const roleNames = (roleRows ?? []).map((r) => r.roles?.name).filter(Boolean)
    if (roleNames.includes("admin")) {
      role = "admin"
    } else if (roleNames.includes("mentor")) {
      role = "mentor"
    } else {
      role = "mentee"
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, full_name")
      .eq("id", user.id)
      .maybeSingle()

    firstName =
      profile?.first_name ||
      (user as any).user_metadata?.first_name ||
      profile?.full_name?.split(" ")[0] ||
      "colega"
  }

  // 2. Base universal tools
  const searchMentorsTool = tool(
    async (input) => {
      const results = await assistantTools.searchMentors(supabase, input)
      if (results.forLlm.length === 0) {
        return [
          "RESULTADO VAZIO. AVISO DO SISTEMA: Não tente buscar novamente. Informe imediatamente ao usuário, em poucas palavras, que você não encontrou mentores para esse tema e sugira outras áreas da plataforma.",
          []
        ]
      }
      return [JSON.stringify(results.forLlm), results.forCard]
    },
    {
      name: "searchMentors",
      description: "Busca mentores no catálogo usando filtro por relevância e IA",
      schema: searchMentorsInput,
      responseFormat: "content_and_artifact"
    }
  )

  const getMentorAvailabilityTool = tool(
    async (input) => JSON.stringify(await assistantTools.getMentorAvailability(supabase, input)),
    {
      name: "getMentorAvailability",
      description: "Retorna a agenda do mentor nos próximos dias usando o slug",
      schema: getMentorAvailabilityInput
    }
  )

  const explainHowItWorksTool = tool(
    async (input) => JSON.stringify(assistantTools.explainHowItWorks(input)),
    {
      name: "explainHowItWorks",
      description: "Responde dúvidas sobre o funcionamento da plataforma Menvo",
      schema: explainHowItWorksInput
    }
  )

  const saveFeedbackTool = tool(
    async (input) => JSON.stringify(await assistantTools.saveFeedback(supabase, input)),
    {
      name: "saveFeedback",
      description: "Salva a nota de avaliação do usuário (1 a 5) e comentário sobre o atendimento no banco de dados",
      schema: saveFeedbackInput
    }
  )

  const tools: any[] = [
    searchMentorsTool,
    getMentorAvailabilityTool,
    explainHowItWorksTool,
    saveFeedbackTool
  ]

  // 3. User-specific RBAC tools
  if (user?.id) {
    const userId = user.id

    const getMyAppointmentsTool = tool(
      async (input) => JSON.stringify(await assistantTools.getMyAppointments(supabase, userId, input)),
      {
        name: "getMyAppointments",
        description: "Consulta as mentorias agendadas do usuário atual (próximas e recentes)",
        schema: getMyAppointmentsInput
      }
    )
    tools.push(getMyAppointmentsTool)

    // Mentee and Admin can check evaluations (Invariant #2: only mentees evaluate mentors)
    if (role === "mentee" || role === "admin") {
      const getPendingEvaluationsTool = tool(
        async () => JSON.stringify(await assistantTools.getPendingEvaluations(supabase, userId, role)),
        {
          name: "getPendingEvaluations",
          description: "Consulta mentorias concluídas que ainda aguardam avaliação pelo mentorado",
          schema: getPendingEvaluationsInput
        }
      )
      tools.push(getPendingEvaluationsTool)
    }

    // Mentor and Admin can check pending requests from mentees
    if (role === "mentor" || role === "admin") {
      const getMentorRequestsTool = tool(
        async () => JSON.stringify(await assistantTools.getMentorRequests(supabase, userId, role)),
        {
          name: "getMentorRequests",
          description: "Consulta solicitações de mentoria pendentes de confirmação pelo mentor",
          schema: getMentorRequestsInput
        }
      )
      tools.push(getMentorRequestsTool)
    }
  }

  return createAgent({
    model: primary,
    tools,
    systemPrompt: new SystemMessage(buildSystemPrompt(role, firstName)),
    middleware: fallbacks.length > 0 ? [modelFallbackMiddleware(...fallbacks)] : []
  })
}
