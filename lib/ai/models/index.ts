import type { SupabaseClient } from "@supabase/supabase-js"
import type { z } from "zod"
import type { Runnable } from "@langchain/core/runnables"
import type { BaseLanguageModelInput } from "@langchain/core/language_models/base"
import type { AIMessageChunk, BaseMessageChunk } from "@langchain/core/messages"
import type { BaseChatModel } from "@langchain/core/language_models/chat_models"
import type { AiCallRecord } from "../metering"
import type { AiCapability } from "./capabilities"
import type { ModelChain } from "./types"
import type { ModelSpec } from "./schema"
import { loadModelChain } from "./load"
import { createChatModel, hasApiKey } from "./factory"
import { AiModelUnavailableError } from "./types"

export { AI_CAPABILITIES, aiCapabilitySchema, type AiCapability } from "./capabilities"
export { modelParamsSchema, modelSpecSchema, modelConfigRowSchema, type ModelSpec, type ModelParams, type ModelConfigRow } from "./schema"
export { DEFAULT_MODEL_CONFIG } from "./defaults"
export { resolveModelChain } from "./resolve"
export { loadModelChain, __resetModelConfigCache } from "./load"
export { hasApiKey } from "./factory"
export { AiModelUnavailableError, type ModelChain } from "./types"

export interface ModelOptions {
  /** Receives one AiCallRecord per attempt (ok, error, fallback). Required:
   * no metering, no call — AI_PLATFORM_PLAN.md §1 principle 2. */
  onCall: (record: AiCallRecord) => void
}

interface AvailableSpec {
  spec: ModelSpec
  /** False only for the chain's own primary; true for every declared
   * fallback, even if it ends up first because the primary had no API key. */
  isFallback: boolean
}

/**
 * Primary + fallbacks, in order, with any provider missing an API key
 * dropped (ADR 0004 §4: "chave ausente → sai da cadeia, com console.warn").
 *
 * `AI_FORCE_FALLBACK=<capability>` additionally drops the primary for that
 * one capability — evals-only (never set in production), so
 * `npm run test:evals` can exercise the fallback path deliberately
 * (ADR 0004 §7.1 point 4) without needing to fake a provider outage.
 */
function availableSpecs(chain: ModelChain): AvailableSpec[] {
  const forcedFallback = process.env.AI_FORCE_FALLBACK === chain.capability
  const all: AvailableSpec[] = [
    ...(forcedFallback ? [] : [{ spec: chain.primary, isFallback: false }]),
    ...chain.fallbacks.map((spec) => ({ spec, isFallback: true }))
  ]
  const available = all.filter(({ spec }) => hasApiKey(spec.provider))
  for (const { spec } of all) {
    if (!hasApiKey(spec.provider)) {
      console.warn(`[ai/models] ${chain.capability}: skipping ${spec.provider}/${spec.model}, no API key configured`)
    }
  }
  return available
}

async function resolveAvailable(
  supabase: SupabaseClient,
  capability: AiCapability
): Promise<{ chain: ModelChain; available: AvailableSpec[] }> {
  const chain = await loadModelChain(supabase, capability)
  const available = availableSpecs(chain)
  if (available.length === 0) throw new AiModelUnavailableError(capability)
  return { chain, available }
}

/**
 * Plain text-generating model with fallbacks (e.g. `followup`). Streams like
 * any LangChain chat model — `withFallbacks` only switches model if the
 * *first* chunk fails to arrive (ADR 0004 §1 fact 3), which is why the
 * primary should use a low `maxRetries` (factory.ts default: 1).
 */
export async function getModel(
  supabase: SupabaseClient,
  capability: AiCapability,
  opts: ModelOptions
): Promise<Runnable<BaseLanguageModelInput, AIMessageChunk | BaseMessageChunk>> {
  const { available } = await resolveAvailable(supabase, capability)
  const [first, ...rest] = available.map(({ spec, isFallback }) =>
    createChatModel(spec, { isFallback, onCall: opts.onCall })
  )
  return rest.length > 0 ? first.withFallbacks(rest) : first
}

/**
 * Structured (Zod) output with fallbacks — `extract`, `analyze`, `route`,
 * `rank`. Each model gets `withStructuredOutput` BEFORE `withFallbacks`: a
 * `RunnableWithFallbacks` has no `withStructuredOutput` method of its own.
 */
export async function getStructuredModel<T extends Record<string, unknown>>(
  supabase: SupabaseClient,
  capability: AiCapability,
  // Input left as `any`, not defaulted to T: a schema built with `.default()`
  // fields (common for LLM output — every field optional pre-parse, filled
  // in post-parse) has an Input type that legitimately differs from its
  // Output type, and `withStructuredOutput` itself only cares about Output.
  schema: z.ZodType<T, z.ZodTypeDef, any>,
  opts: ModelOptions
): Promise<Runnable<BaseLanguageModelInput, T>> {
  const { available } = await resolveAvailable(supabase, capability)
  const [first, ...rest] = available.map(({ spec, isFallback }) =>
    createChatModel(spec, { isFallback, onCall: opts.onCall }).withStructuredOutput<T>(schema)
  )
  return rest.length > 0 ? first.withFallbacks(rest) : first
}

/**
 * Model instances for `createAgent` + `modelFallbackMiddleware` (`converse`
 * — an agent with tools). `withFallbacks` cannot be used here: its
 * `_bindTools` rejects a `RunnableWithFallbacks` (ADR 0004 §1 fact 1), and
 * `createReactAgent` is deprecated (fact 2) in favor of `langchain`'s
 * `createAgent`, whose `modelFallbackMiddleware` re-runs the tool-bound
 * request against each fallback model in turn.
 */
export async function getAgentModels(
  supabase: SupabaseClient,
  capability: AiCapability,
  opts: ModelOptions
): Promise<{ primary: BaseChatModel; fallbacks: BaseChatModel[]; chain: ModelChain }> {
  const { chain, available } = await resolveAvailable(supabase, capability)
  const [primary, ...fallbacks] = available.map(({ spec, isFallback }) =>
    createChatModel(spec, { isFallback, onCall: opts.onCall })
  )
  return { primary, fallbacks, chain }
}
