/**
 * Eval for the assistant agent (lib/services/assistant/agent.ts, capability
 * "converse" in the model registry, ADR 0004) — the real network calls, not
 * a mock. Run manually (costs a handful of real LLM calls); never wired into
 * `npm test`.
 *
 * Runs the suite twice: once against the registry's normal chain, once with
 * `AI_FORCE_FALLBACK=converse`, which drops the primary model so the run
 * exercises the fallback model with the same 4 tools (ADR 0004 §7.1 point 4:
 * a fallback that can't call tools would be a regression `withFallbacks`
 * alone couldn't have caught).
 *
 * Usage:
 *   npm run test:evals
 */
import { testCases } from "./assistant.cases.mjs"
import { createClient } from "@supabase/supabase-js"
import { HumanMessage } from "@langchain/core/messages"
import { config } from "dotenv"
import { getAssistantAgent } from "../lib/services/assistant/agent"
import type { AiCallRecord } from "../lib/ai/metering"

config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function runEval(label: string) {
  console.log(`\n=== Running Evals: ${label} ===`)

  let totalLatency = 0
  let successCount = 0

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i]
    const start = Date.now()

    try {
      const calls: AiCallRecord[] = []
      const agent = await getAssistantAgent(supabase, { onCall: (record) => calls.push(record) })

      const response = await agent.invoke({
        messages: [new HumanMessage(testCase.input)]
      })

      const latency = Date.now() - start
      totalLatency += latency

      const messages = response.messages as any[]
      const aiMessage = messages[messages.length - 1].content

      let calledTool = null
      for (const msg of messages) {
        if (msg.tool_calls && msg.tool_calls.length > 0) {
          calledTool = msg.tool_calls[0].name
          break
        }
      }

      const toolMatch = testCase.expectedTool === calledTool
      const patternMatch = testCase.expectedResponsePattern ? testCase.expectedResponsePattern.test(aiMessage) : true

      const passed = toolMatch && patternMatch
      if (passed) successCount++

      const tier = calls.map((c) => `${c.provider}:${c.status}`).join(" → ")
      console.log(`Test ${i + 1}/${testCases.length}: ${passed ? "✅" : "❌"} (${latency}ms, ${tier}) - Input: "${testCase.input}"`)
      if (!passed) {
        console.log(`  Expected Tool: ${testCase.expectedTool}, Got: ${calledTool}`)
        console.log(`  Response: ${aiMessage}`)
      }
    } catch (err: any) {
      console.log(`Test ${i + 1}/${testCases.length}: ❌ (ERROR) - ${err.message}`)
    }
  }

  const avgLatency = (totalLatency / testCases.length).toFixed(2)
  console.log(`\nResults for ${label}:`)
  console.log(`Success Rate: ${successCount}/${testCases.length} (${((successCount / testCases.length) * 100).toFixed(1)}%)`)
  console.log(`Average Latency: ${avgLatency}ms`)

  return successCount === testCases.length
}

async function main() {
  delete process.env.AI_FORCE_FALLBACK
  const primaryOk = await runEval("converse — primary model")

  process.env.AI_FORCE_FALLBACK = "converse"
  const fallbackOk = await runEval("converse — forced fallback")
  delete process.env.AI_FORCE_FALLBACK

  if (!primaryOk || !fallbackOk) process.exitCode = 1
}

main().catch(console.error)
