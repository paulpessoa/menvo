import { BaseCallbackHandler } from "@langchain/core/callbacks/base"
import type { LLMResult } from "@langchain/core/outputs"
import type { AiCallRecord } from "../metering"
import type { ModelSpec } from "../models/schema"

type TokenUsage = Pick<AiCallRecord, "inputTokens" | "outputTokens" | "cachedInputTokens">

interface RawUsage {
  input_tokens?: number
  output_tokens?: number
  prompt_tokens?: number
  completion_tokens?: number
  input_token_details?: { cache_read?: number }
  prompt_tokens_details?: { cached_tokens?: number }
}

/**
 * Providers put token counts in different places, and some only in some
 * modes: `usage_metadata` is the standard spot, but ChatGroq *streaming*
 * leaves it empty and reports usage only in `response_metadata.usage`
 * (verified with a real call, 2026-09-23 — the assistant streams, so its Groq
 * fallback metered 0 tokens and would have been invisible to `ai_budget`).
 * `llmOutput.tokenUsage` is the older non-streaming shape.
 */
function readUsage(output: LLMResult): TokenUsage {
  const message = (output.generations?.[0]?.[0] as { message?: Record<string, any> } | undefined)?.message
  const standard = message?.usage_metadata as RawUsage | undefined
  if (standard && (standard.input_tokens || standard.output_tokens)) {
    return {
      inputTokens: standard.input_tokens ?? 0,
      outputTokens: standard.output_tokens ?? 0,
      cachedInputTokens: standard.input_token_details?.cache_read ?? 0
    }
  }

  const raw = message?.response_metadata?.usage as RawUsage | undefined
  if (raw && (raw.input_tokens || raw.prompt_tokens || raw.output_tokens || raw.completion_tokens)) {
    return {
      inputTokens: raw.input_tokens ?? raw.prompt_tokens ?? 0,
      outputTokens: raw.output_tokens ?? raw.completion_tokens ?? 0,
      cachedInputTokens: raw.prompt_tokens_details?.cached_tokens ?? 0
    }
  }

  const legacy = output.llmOutput?.tokenUsage as { promptTokens?: number; completionTokens?: number } | undefined
  return {
    inputTokens: legacy?.promptTokens ?? 0,
    outputTokens: legacy?.completionTokens ?? 0,
    cachedInputTokens: 0
  }
}

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

      const usage = readUsage(output)

      opts.onCall({
        provider: opts.provider,
        model: opts.model,
        ...usage,
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
