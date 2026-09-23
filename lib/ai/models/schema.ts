import { z } from "zod"
import { aiCapabilitySchema } from "./capabilities"

/**
 * Provider-neutral knobs. The factory (factory.ts) translates these into
 * each provider's own constructor field names (`maxOutputTokens` for Gemini,
 * `maxTokens` for Groq/OpenAI). `.strict()` so an unknown key (a typo in the
 * DB row) makes the whole row invalid rather than being silently ignored.
 */
export const modelParamsSchema = z
  .object({
    temperature: z.number().min(0).max(2).optional(),
    maxOutputTokens: z.number().int().positive().max(32_768).optional(),
    // Default: 1 on the primary, 0 on fallbacks (index.ts) — fast enough
    // that a fallback switch happens in seconds, not the SDK's default of 6.
    maxRetries: z.number().int().min(0).max(3).optional(),
    timeoutMs: z.number().int().min(1_000).max(120_000).optional()
  })
  .strict()

export type ModelParams = z.infer<typeof modelParamsSchema>

export const modelSpecSchema = z.object({
  provider: z.enum(["google", "groq", "openai"]),
  model: z.string().min(1).max(100),
  params: modelParamsSchema.default({})
})

export type ModelSpec = z.infer<typeof modelSpecSchema>

/** Shape of one row read from `ai_model_config`. */
export const modelConfigRowSchema = z.object({
  capability: aiCapabilitySchema,
  provider: z.enum(["google", "groq", "openai"]),
  model: z.string().min(1).max(100),
  params: modelParamsSchema.default({}),
  fallback: z.array(modelSpecSchema).default([]),
  active: z.boolean()
})

export type ModelConfigRow = z.infer<typeof modelConfigRowSchema>
