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
  explainHowItWorksInput
} from "@/lib/services/assistant/tools"

const SYSTEM_PROMPT = `Você é o Menvo Assistant, o assistente oficial da Menvo (uma plataforma brasileira e gratuita de mentorias 1-a-1).
Seu objetivo é ajudar usuários a encontrar mentores e tirar dúvidas sobre a plataforma.
Regras:
1. Responda sempre em Português do Brasil de forma amigável, acolhedora e concisa.
2. Não invente informações sobre mentores. Se não souber, use a ferramenta de busca de mentores.
3. Se perguntarem sobre horários, sempre chame a ferramenta de disponibilidade do mentor (exige o slug do mentor).
4. Para explicar como a plataforma funciona, use a ferramenta "explainHowItWorks".`

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
  // Portanto, usaremos o modelo primário diretamente.
  const primaryModel = groqModel

  // 2. Configurar Tools
  const searchMentorsTool = tool(
    async (input) => JSON.stringify(await assistantTools.searchMentors(supabase, input)),
    {
      name: "searchMentors",
      description: "Busca mentores no catálogo usando filtro por relevância e IA",
      schema: searchMentorsInput
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

  const tools = [searchMentorsTool, getMentorAvailabilityTool, explainHowItWorksTool]

  // 3. Criar e retornar Agent
  return createReactAgent({
    llm: primaryModel,
    tools,
    messageModifier: new SystemMessage(SYSTEM_PROMPT)
  })
}
