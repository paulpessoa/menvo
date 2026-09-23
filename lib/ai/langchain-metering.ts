import { z } from "zod"
import type { AiCallRecord } from "./metering"

const startSchema = z.object({ event: z.literal("on_chat_model_start"), run_id: z.string() })

const endSchema = z.object({
  event: z.literal("on_chat_model_end"),
  run_id: z.string(),
  metadata: z
    .object({ ls_provider: z.string().optional(), ls_model_name: z.string().optional() })
    .passthrough()
    .optional(),
  data: z
    .object({
      output: z
        .object({
          usage_metadata: z
            .object({
              input_tokens: z.number().default(0),
              output_tokens: z.number().default(0),
              input_token_details: z.object({ cache_read: z.number().optional() }).passthrough().optional()
            })
            .passthrough()
            .optional()
        })
        .passthrough()
        .optional()
    })
    .passthrough()
})

// LangChain's provider ids differ from ours (and from `ai_model_pricing`).
const PROVIDER_ALIASES: Record<string, string> = { google_genai: "google", google_vertexai: "google" }

/**
 * Turns LangChain `streamEvents` (v2) into one `AiCallRecord` per chat-model
 * call. An agent turn can call the model several times (reason → tool →
 * answer), and each of those is billed, so metering the turn as "one call"
 * would under-count exactly the agentic features we most need to watch.
 */
export function createLangChainUsageCollector() {
  const startedAt = new Map<string, number>()
  const calls: AiCallRecord[] = []

  return {
    calls,
    handle(event: unknown) {
      const start = startSchema.safeParse(event)
      if (start.success) {
        startedAt.set(start.data.run_id, Date.now())
        return
      }

      const end = endSchema.safeParse(event)
      if (!end.success) return

      const { run_id, metadata, data } = end.data
      const usage = data.output?.usage_metadata
      const provider = metadata?.ls_provider ?? "unknown"
      calls.push({
        provider: PROVIDER_ALIASES[provider] ?? provider,
        model: (metadata?.ls_model_name ?? "unknown").replace(/^models\//, ""),
        inputTokens: usage?.input_tokens ?? 0,
        outputTokens: usage?.output_tokens ?? 0,
        cachedInputTokens: usage?.input_token_details?.cache_read ?? 0,
        latencyMs: Date.now() - (startedAt.get(run_id) ?? Date.now()),
        status: "ok"
      })
      startedAt.delete(run_id)
    }
  }
}
