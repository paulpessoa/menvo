import { createAgent, modelFallbackMiddleware } from "langchain"
import { SystemMessage } from "@langchain/core/messages"
import { SupabaseClient, type User } from "@supabase/supabase-js"
import { getAgentModels } from "@/lib/ai/models"
import type { AiCallRecord } from "@/lib/ai/metering"
import { diagnosticService } from "@/lib/services/diagnostic/diagnostic.service"
import { resolveActor } from "@/lib/services/assistant/actor.service"
import { toLangChainTools } from "@/lib/agents/adapters/langchain"

export interface GetAssistantAgentOptions {
  /** Receives one AiCallRecord per model attempt (primary + every fallback
   * try), success or failure - ADR 0004 §6. */
  onCall: (record: AiCallRecord) => void
}

interface DiagnosticContext {
  completed: boolean
  insights?: string
}

function buildSystemPrompt(role: "mentee" | "mentor" | "admin", firstName: string, diagnostic: DiagnosticContext): string {
  let roleGuidance = ""
  if (role === "mentor") {
    roleGuidance = `
PAPEL DO USUÁRIO ATUAL: MENTOR (${firstName})
- O usuário é um MENTOR voluntário na Menvo.
- Priorize ajudá-lo na gestão de suas mentorias, visualização de solicitações pendentes e agenda.
- Ao instruí-lo a acessar alguma página, forneça o respectivo link em Markdown (ex: [painel](/dashboard/mentor), [perfil](/settings), [agenda](/dashboard/mentor/availability)).
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
    let diagnosticGuidance = ""
    if (diagnostic.completed && diagnostic.insights) {
      diagnosticGuidance = `
- O usuário JÁ COMPLETOU o diagnóstico de carreira dele. 
- INSIGHTS RECEBIDOS PELO USUÁRIO (Baseie-se nisso para guiar a conversa):
${diagnostic.insights}
- Como ele já fez o diagnóstico, pergunte ativamente o que ele achou dos pontos fortes/fracos apontados acima e se quer ajuda para buscar um mentor para trabalhar nesses pontos específicos.`
    } else {
      diagnosticGuidance = `
- O usuário AINDA NÃO completou o diagnóstico de carreira ou não fez recentemente.
- Se ele estiver desorientado sobre o que fazer, não souber que mentor escolher ou não tiver clareza do momento dele, SUGIRA ATIVAMENTE que ele faça o "Diagnóstico de Carreira" clicando no botão "Fazer Diagnóstico" ou digitando "/diagnostico" para alinhar suas expectativas.`
    }

    roleGuidance = `
PAPEL DO USUÁRIO ATUAL: MENTORADO (${firstName})
- O usuário está buscando mentoria e orientação de carreira.
- Se ele expressar um objetivo claro (ex: transição de carreira, entrevistas, dados, IA), CHAME IMEDIATAMENTE a ferramenta "searchMentors". Não pergunte permissão.
- Se ele perguntar sobre suas mentorias agendadas, use "getMyAppointments".
- Se ele perguntar se tem mentorias para avaliar ou quiser avaliar uma mentoria pendente:
  1. Chame "getPendingEvaluations" para consultar as mentorias concluídas ou já realizadas aguardando avaliação.
  2. Apresente ao mentorado as opções disponíveis (nome do mentor, data e horário).
  3. Peça uma nota de 1 a 5 estrelas e um comentário opcional sobre como foi a mentoria.
  4. Com a nota informada pelo mentorado, chame a ferramenta "evaluateMentorshipSession" com o appointmentId e o rating. Ela apenas PROPÕE a avaliação: aparece um cartão com o botão Confirmar. Diga que está aguardando a confirmação dele e NÃO diga que a avaliação foi registrada.
- Reforce sempre que "é bom conversar para abrir a mente" e que a mentoria na Menvo é 100% gratuita.
- Ao citar mentores encontrados, NÃO liste detalhes completos no texto porque cards visuais interativos aparecerão automaticamente. Cite apenas os nomes e a razão da recomendação.${diagnosticGuidance}`
  }

  return `Você é o Copiloto da Menvo (uma plataforma brasileira e gratuita de mentorias 1-a-1). Você NÃO tem um nome humano.
Seu objetivo é apoiar ${firstName} de acordo com suas necessidades na Menvo.

${roleGuidance}

GUARDRAILS E LIMITES (ESTRITAMENTE OBRIGATÓRIO):
- RECUSE-SE, com educação, a responder sobre qualquer tópico que não seja carreira, mentoria, tecnologia, negócios, design, dados ou sobre a Menvo. (Ex: se perguntarem sobre receitas, política, etc., diga que você só pode ajudar com temas de carreira e mentoria).
- NÃO USE EMOJIS (emoticons) nas suas respostas sob nenhuma circunstância, a não ser que o usuário peça expressamente. Não coloque "👋", "🎯", etc.
- SEJA EXTREMAMENTE BREVE E DIRETO. Evite parágrafos longos. Responda em no máximo 2-3 frases curtas. Economize tokens e vá direto ao ponto.
- Se não souber informações sobre mentores, use a ferramenta de busca ("searchMentors"). Não invente perfis. IMPORTANTE: Se a busca não retornar resultados úteis ou retornar vazio, NÃO TENTE realizar a busca novamente em loop. Informe imediatamente ao usuário e ofereça outra alternativa.
- Para horários de um mentor específico, use "getMentorAvailability" (exige o slug).
- Para dúvidas sobre a plataforma, regras, agendamentos, cancelamentos, conduta, certificados ou funcionamento, use a ferramenta "searchKnowledgeBase".
- IMPORTANTE: Após usar uma ferramenta e receber o resultado, formule a resposta final para o usuário e encerre a sua vez. NÃO chame a mesma ferramenta repetidas vezes em loop.

FEEDBACK:
- NÃO peça nota de 1 a 5 no fim das mensagens. Mantenha a conversa fluindo naturalmente. Pergunte se o usuário precisa de mais alguma coisa ou quer um tempo para pensar.
- Se o usuário enviar espontaneamente um feedback (nota e/ou comentário) sobre o assistente, use a ferramenta "saveFeedback". Ela apenas PROPÕE o envio (o usuário confirma no cartão): peça que confirme na tela, sem dizer que já foi salvo.
- Para avaliação de sessões de mentoria com mentores, utilize a ferramenta dedicada "evaluateMentorshipSession" (também exige confirmação do usuário no cartão).`
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
  const diagnosticContext: DiagnosticContext = { completed: false }

  if (user?.id) {
    role = (await resolveActor(supabase, user.id)).role

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

    // Only mentees need the diagnostic context for now
    if (role === "mentee") {
      const latestDiagnostic = await diagnosticService.getLatestCompletedSession(supabase, user.id)
      if (latestDiagnostic?.quiz_response_id) {
        diagnosticContext.completed = true
        
        // Fetch the quiz response details
        const { data: responseData } = await supabase
          .from("quiz_responses")
          .select("ai_analysis")
          .eq("id", latestDiagnostic.quiz_response_id)
          .maybeSingle()

        if (responseData?.ai_analysis) {
          const analysis = responseData.ai_analysis as Record<string, any>
          const strengths = Array.isArray(analysis.strengths) ? analysis.strengths.join(", ") : ""
          const gaps = Array.isArray(analysis.gaps) ? analysis.gaps.join(", ") : ""
          const suggestion = analysis.recommendation || ""
          
          diagnosticContext.insights = `
Pontos Fortes: ${strengths}
Áreas de Desenvolvimento: ${gaps}
Recomendação da IA na época: ${suggestion}`.trim()
        }
      }
    }
  }

  // 2. Tools: quais existem e para quem é decidido em lib/agents/exposure.ts
  // (negar por padrão, filtrado pelo papel). Sem usuário, só as públicas.
  const tools = toLangChainTools(supabase, user?.id ? { id: user.id, role } : null)

  return createAgent({
    model: primary,
    tools,
    systemPrompt: new SystemMessage(buildSystemPrompt(role, firstName, diagnosticContext)),
    middleware: fallbacks.length > 0 ? [modelFallbackMiddleware(...fallbacks)] : []
  })
}
