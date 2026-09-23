import { z } from "zod"

/**
 * Every task an LLM performs anywhere on the platform is named here (ADR 0004
 * §1 principle 3: "model is configuration, not code"). `ai_model_config` has
 * one row per capability, resolving it to provider + model + fallback chain.
 * Adding a capability = add it here + a row in `DEFAULT_MODEL_CONFIG`
 * (defaults.ts) + a seed row in the migration; without those it has no model.
 */
export const AI_CAPABILITIES = [
  "route",
  "extract",
  "followup",
  "converse",
  "analyze",
  "classify_batch",
  "rank"
] as const

export const aiCapabilitySchema = z.enum(AI_CAPABILITIES)

export type AiCapability = (typeof AI_CAPABILITIES)[number]
