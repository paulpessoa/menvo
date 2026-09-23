import type { AiCapability } from "./capabilities"
import { modelConfigRowSchema } from "./schema"
import { DEFAULT_MODEL_CONFIG } from "./defaults"
import type { ModelChain } from "./types"

/**
 * Turns raw `ai_model_config` rows into a `ModelChain` for one capability.
 * Pure — no I/O, no Supabase client — so it's trivial to unit test every edge
 * case in ADR 0004 §5's table without a database.
 *
 * Falls back to `DEFAULT_MODEL_CONFIG[capability]` (source: "default") when:
 * the table has no row for this capability, the row is `active: false`, or
 * the row fails Zod validation (unknown provider, malformed fallback entry,
 * an extra key in `params`, …). A malformed row logs a warning; the other
 * two cases are the normal state before the table is seeded and log nothing.
 */
export function resolveModelChain(capability: AiCapability, rows: unknown[] | null | undefined): ModelChain {
  const fallback = DEFAULT_MODEL_CONFIG[capability]
  if (!rows || rows.length === 0) return fallback

  const row = rows.find((r) => (r as { capability?: unknown } | null)?.capability === capability)
  if (!row) return fallback

  const parsed = modelConfigRowSchema.safeParse(row)
  if (!parsed.success) {
    console.warn(`[ai/models] invalid ai_model_config row for capability "${capability}":`, parsed.error.message)
    return fallback
  }

  if (!parsed.data.active) return fallback

  return {
    capability,
    source: "db",
    primary: { provider: parsed.data.provider, model: parsed.data.model, params: parsed.data.params },
    fallbacks: parsed.data.fallback
  }
}
