import type { BaseChatModel } from "@langchain/core/language_models/chat_models"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatGroq } from "@langchain/groq"
import { ChatOpenAI } from "@langchain/openai"
import { createMeteringCallback } from "../metering/callback"
import type { AiCallRecord } from "../metering"
import type { ModelSpec } from "./schema"

const API_KEYS: Record<ModelSpec["provider"], () => string | undefined> = {
  google: () => process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY,
  groq: () => process.env.GROQ_API_KEY,
  openai: () => process.env.OPENAI_API_KEY
}

/** True when the provider has an API key configured in this environment. */
export function hasApiKey(provider: ModelSpec["provider"]): boolean {
  return Boolean(API_KEYS[provider]())
}

export interface CreateChatModelOptions {
  /** True for every model past the first in the chain — used for the default
   * `maxRetries` and for tagging metering rows `status: "fallback"`. */
  isFallback: boolean
  onCall: (record: AiCallRecord) => void
}

/**
 * Instantiates the LangChain chat model for one `ModelSpec`, with a metering
 * callback attached in the constructor (so it survives `bindTools`,
 * `withStructuredOutput` and `withFallbacks` — ADR 0004 §6). Parameter names
 * differ per provider (Gemini: `maxOutputTokens`; Groq/OpenAI: `maxTokens`),
 * which is exactly what this function exists to hide from call sites.
 */
export function createChatModel(spec: ModelSpec, opts: CreateChatModelOptions): BaseChatModel {
  const apiKey = API_KEYS[spec.provider]()
  const maxRetries = spec.params.maxRetries ?? (opts.isFallback ? 0 : 1)
  const callbacks = [
    createMeteringCallback({
      provider: spec.provider,
      model: spec.model,
      isFallback: opts.isFallback,
      onCall: opts.onCall
    })
  ]

  switch (spec.provider) {
    case "google":
      return new ChatGoogleGenerativeAI({
        model: spec.model,
        apiKey,
        temperature: spec.params.temperature,
        maxOutputTokens: spec.params.maxOutputTokens,
        maxRetries,
        callbacks
      }) as unknown as BaseChatModel

    case "groq":
      return new ChatGroq({
        model: spec.model,
        apiKey,
        temperature: spec.params.temperature,
        maxTokens: spec.params.maxOutputTokens,
        maxRetries,
        timeout: spec.params.timeoutMs,
        callbacks
      }) as unknown as BaseChatModel

    case "openai":
      return new ChatOpenAI({
        model: spec.model,
        apiKey,
        // gpt-5-mini (a reasoning model) rejects a non-default temperature,
        // so it's only sent when the config actually sets one.
        temperature: spec.params.temperature,
        maxTokens: spec.params.maxOutputTokens,
        maxRetries,
        timeout: spec.params.timeoutMs,
        callbacks
      }) as unknown as BaseChatModel
  }
}
