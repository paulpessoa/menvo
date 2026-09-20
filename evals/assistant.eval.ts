import { testCases } from "./assistant.cases.mjs"
import { createClient } from "@supabase/supabase-js"
import { ChatGroq } from "@langchain/groq"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { tool } from "@langchain/core/tools"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { config } from "dotenv"

config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Mock tools for evaluation (we don't want to actually hit the DB for all cases)
const searchMentorsTool = tool(
  async () => JSON.stringify([{ slug: "mocked", fullName: "Mocked Mentor" }]),
  {
    name: "searchMentors",
    description: "Busca mentores no catálogo usando filtro por relevância e IA",
    schema: require("../lib/services/assistant/tools").searchMentorsInput
  }
)

const getMentorAvailabilityTool = tool(
  async () => JSON.stringify({ mentorName: "Mocked", slots: [] }),
  {
    name: "getMentorAvailability",
    description: "Retorna a agenda do mentor nos próximos dias usando o slug",
    schema: require("../lib/services/assistant/tools").getMentorAvailabilityInput
  }
)

const explainHowItWorksTool = tool(
  async () => JSON.stringify({ topic: "mocked", answer: "Mocked explanation", links: [] }),
  {
    name: "explainHowItWorks",
    description: "Responde dúvidas sobre o funcionamento da plataforma Menvo",
    schema: require("../lib/services/assistant/tools").explainHowItWorksInput
  }
)

const tools = [searchMentorsTool, getMentorAvailabilityTool, explainHowItWorksTool]
const SYSTEM_PROMPT = `Você é o Menvo Assistant. Responda em Português.`

async function runEval(modelName: string, model: any) {
  console.log(`\n=== Running Evals for ${modelName} ===`)

  const agent = createReactAgent({
    llm: model,
    tools,
    messageModifier: new SystemMessage(SYSTEM_PROMPT)
  })

  let totalLatency = 0
  let successCount = 0

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i]
    const start = Date.now()

    try {
      const response = await agent.invoke({
        messages: [new HumanMessage(testCase.input)]
      })

      const end = Date.now()
      const latency = end - start
      totalLatency += latency

      const messages = response.messages
      const aiMessage: any = messages[messages.length - 1].content

      let calledTool = null
      for (const msg of messages as any[]) {
        if (msg.tool_calls && msg.tool_calls.length > 0) {
          calledTool = msg.tool_calls[0].name
          break
        }
      }

      const toolMatch = testCase.expectedTool === calledTool
      // Se não tem padrão, consideramos como sucesso o toolMatch, caso contrario os dois.
      const patternMatch = testCase.expectedResponsePattern ? testCase.expectedResponsePattern.test(aiMessage) : true

      const passed = toolMatch && patternMatch
      if (passed) successCount++

      console.log(`Test ${i + 1}/${testCases.length}: ${passed ? '✅' : '❌'} (${latency}ms) - Input: "${testCase.input}"`)
      if (!passed) {
        console.log(`  Expected Tool: ${testCase.expectedTool}, Got: ${calledTool}`)
        console.log(`  Response: ${aiMessage}`)
      }
    } catch (err: any) {
      console.log(`Test ${i + 1}/${testCases.length}: ❌ (ERROR) - ${err.message}`)
    }
  }

  const avgLatency = (totalLatency / testCases.length).toFixed(2)
  console.log(`\nResults for ${modelName}:`)
  console.log(`Success Rate: ${successCount}/${testCases.length} (${((successCount / testCases.length) * 100).toFixed(1)}%)`)
  console.log(`Average Latency: ${avgLatency}ms`)
}

async function main() {
  const groqModel = new ChatGroq({
    model: "qwen/qwen3.8-27b",
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0
  })

  const geminiModel = new ChatGoogleGenerativeAI({
    model: "gemini-3.5-flash-lite",
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    temperature: 0
  })

  await runEval("Qwen 3.8 27b (Groq)", groqModel)
  await runEval("Gemini 2.5 Flash-Lite (Google)", geminiModel)
}

main().catch(console.error)
