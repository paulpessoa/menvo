import { BaseCallbackHandler } from "@langchain/core/callbacks/base"
import type { LLMResult } from "@langchain/core/outputs"
import type { AiCallRecord } from "../metering"
import type { ModelSpec } from "../models/schema"

export interface MeteringCallbackOptions {
  provider: ModelSpec["provider"]
  model: string
  /** True when this callback is attached to a fallback model, not the primary. */
  isFallback: boolean
  onCall: (record: AiCallRecord) => void
}

/**
 * One callback handler per model instance (attached by
 * `lib/ai/models/factory.ts`), replacing the `streamEvents`-based collector
 * (`lib/ai/langchain-metering.ts`, removed — ADR 0004 §6). Passing callbacks
 * in the model's constructor means they survive `bindTools`,
 * `withStructuredOutput` and `withFallbacks`, and — unlike `streamEvents`,
 * which has no `on_chat_model_error` event — this also sees failed attempts,
 * which is what makes fallback + metering work together correctly.
 */
export function createMeteringCallback(opts: MeteringCallbackOptions): BaseCallbackHandler {
  const startedAt = new Map<string, number>()

  class MeteringCallbackHandler extends BaseCallbackHandler {
    name = "menvo_metering_callback"

    handleLLMStart(_llm: unknown, _prompts: string[], runId: string) {
      startedAt.set(runId, Date.now())
    }

    handleChatModelStart(_llm: unknown, _messages: unknown[], runId: string) {
      startedAt.set(runId, Date.now())
    }

    handleLLMEnd(output: LLMResult, runId: string) {
      const latencyMs = Date.now() - (startedAt.get(runId) ?? Date.now())
      startedAt.delete(runId)

      const message = output.generations?.[0]?.[0] as { message?: { usage_metadata?: Record<string, unknown> } } | undefined
      const usage = message?.message?.usage_metadata as
        | { input_tokens?: number; output_tokens?: number; input_token_details?: { cache_read?: number } }
        | undefined

      opts.onCall({
        provider: opts.provider,
        model: opts.model,
        inputTokens: usage?.input_tokens ?? 0,
        outputTokens: usage?.output_tokens ?? 0,
        cachedInputTokens: usage?.input_token_details?.cache_read ?? 0,
        latencyMs,
        status: opts.isFallback ? "fallback" : "ok"
      })
    }

    handleLLMError(err: Error, runId: string) {
      const latencyMs = Date.now() - (startedAt.get(runId) ?? Date.now())
      startedAt.delete(runId)

      opts.onCall({
        provider: opts.provider,
        model: opts.model,
        inputTokens: 0,
        outputTokens: 0,
        cachedInputTokens: 0,
        latencyMs,
        status: "error",
        // Never the error message: it can echo back user content.
        errorCode: err.name || "error"
      })
    }
  }

  return new MeteringCallbackHandler()
}
