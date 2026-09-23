import { ChatGroq } from "@langchain/groq"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { tool } from "@langchain/core/tools"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { SupabaseClient } from "@supabase/supabase-js"
import {
  assistantTools,
  searchMentorsInput,
  getMentorAvailabilityInput,
  explainHowItWorksInput,
  saveFeedbackInput
} from "@/lib/services/assistant/tools"

const SYSTEM_PROMPT = `Você é o assistente virtual da Menvo (uma plataforma brasileira e gratuita de mentorias 1-a-1). Você NÃO tem um nome humano.
Seu objetivo é ajudar usuários a encontrar mentores e tirar dúvidas sobre a plataforma, focando no apoio a quem busca mentoria pela primeira vez.

GUARDRAILS E LIMITES (ESTRITAMENTE OBRIGATÓRIO):
- RECUSE-SE, com educação, a responder sobre qualquer tópico que não seja carreira, mentoria, tecnologia, negócios, design, dados ou sobre a Menvo. (Ex: se perguntarem sobre receitas, educação infantil no jardim de infância, política, etc., diga que você só pode ajudar com temas de carreira e mentoria).
- NÃO USE EMOJIS nas suas respostas sob nenhuma circunstância.
- Se não souber informações sobre mentores, use a ferramenta de busca. Não invente perfis. IMPORTANTE: Se a busca não retornar resultados úteis ou retornar vazio, NÃO TENTE realizar a busca novamente em loop. Informe imediatamente ao usuário e ofereça outra alternativa.

COMO AGIR COM QUEM BUSCA MENTORIA:
- SEJA EXTREMAMENTE BREVE E DIRETO. Evite parágrafos longos. Responda em no máximo 2-3 frases curtas. Economize tokens e vá direto ao ponto.
- Se o usuário expressar um objetivo claro (ex: "quero criar um podcast", "quero investir", "quero migrar para tech"), mesmo que ele diga "não sei por onde começar", CHAME IMEDIATAMENTE a ferramenta de busca para esse tema. Não pergunte permissão para buscar.
- Ao citar os mentores encontrados, NÃO liste os detalhes completos (bio, cidade, etc) no texto, pois cards visuais interativos aparecerão automaticamente abaixo da sua resposta. Apenas cite os nomes e explique por que os recomendou de forma muito breve.
- Se o usuário parecer totalmente indeciso e sem foco nenhum, só aí sugira o /quiz de carreira.
- Sugira buscar um mentor específico para destravar o usuário (ex: se ele quer empreender/abrir negócio, busque mentores de negócios/empreendedorismo; se quer investir, busque finanças).
- Reforce sempre que "é bom conversar para abrir a mente", deixando o usuário à vontade.
- Se perguntarem sobre horários de um mentor, use a ferramenta de disponibilidade (exige o slug).
- Para explicar como a plataforma funciona, use "explainHowItWorks".
- IMPORTANTE: Após usar uma ferramenta e receber o resultado, formule a resposta final para o usuário e encerre a sua vez. NÃO chame a mesma ferramenta repetidas vezes em loop.

FEEDBACK:
- Ao fim de uma conversa ou quando resolver o problema do usuário, peça a ele um feedback sobre o seu atendimento. Peça para ele responder no chat dando uma nota de 1 a 5 e um comentário.
- Se o usuário enviar um feedback (nota e comentário), você DEVE obrigatoriamente usar a ferramenta "saveFeedback" para salvar no banco de dados e agradecê-lo em seguida.`

export function getAssistantAgent(supabase: SupabaseClient) {
  // 1. Configurar Modelos com Fallback
  const groqModel = new ChatGroq({
    model: "qwen/qwen3.8-27b",
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0.3
  })

  const geminiModel = new ChatGoogleGenerativeAI({
    model: "gemini-3.5-flash-lite",
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    temperature: 0.3
  })

  // O withFallbacks nativo não suporta bindTools diretamente no createReactAgent
  // Portanto, vamos usar o Gemini (que respeita os tool limits e stop words) como primário
  // para evitar o loop infinito (Recursion limit) que o modelo Qwen no Groq está causando.
  const primaryModel = geminiModel

  // 2. Configurar Tools
  const searchMentorsTool = tool(
    async (input) => {
      const results = await assistantTools.searchMentors(supabase, input)
      if (results.forLlm.length === 0) {
        return [
          "RESULTADO VAZIO. AVISO DO SISTEMA: Não tente buscar novamente. Informe imediatamente ao usuário, em poucas palavras, que você não encontrou mentores para esse tema e sugira outras áreas da plataforma.",
          []
        ]
      }
      // content (enxuto) vai para o LLM; artifact (card) vai só para a UI via SSE.
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

  const tools = [searchMentorsTool, getMentorAvailabilityTool, explainHowItWorksTool, saveFeedbackTool]

  // 3. Criar e retornar Agent
  return createReactAgent({
    llm: primaryModel,
    tools,
    messageModifier: new SystemMessage(SYSTEM_PROMPT)
  })
}
