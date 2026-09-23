import type { SupabaseClient } from "@supabase/supabase-js"
import type { AiCapability } from "./capabilities"
import { resolveModelChain } from "./resolve"
import type { ModelChain } from "./types"

const CACHE_TTL_MS = 60_000
// Short TTL for a failed read, so a real outage doesn't get hammered every
// call but a fixed problem recovers quickly without redeploying.
const ERROR_CACHE_TTL_MS = 10_000
const READ_TIMEOUT_MS = 1_500

interface CacheEntry {
  rows: unknown[] | null
  expiresAt: number
}

// Module-level: memory is fine here because this is configuration, not a
// limit (unlike the quota ledger, which must live in Postgres). Worst case,
// a model swap takes up to 60s to reach a given serverless instance.
let cache: CacheEntry | null = null
let inFlight: Promise<unknown[] | null> | null = null

async function fetchRows(supabase: SupabaseClient): Promise<unknown[] | null> {
  const query = supabase
    .from("ai_model_config" as never)
    .select("capability, provider, model, params, fallback, active")

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("ai_model_config read timed out")), READ_TIMEOUT_MS)
  })

  try {
    const { data, error } = (await Promise.race([query, timeout])) as {
      data: unknown[] | null
      error: { message: string } | null
    }
    if (error) {
      console.warn("[ai/models] failed to read ai_model_config:", error.message)
      return null
    }
    return data
  } catch (err) {
    console.warn("[ai/models] failed to read ai_model_config:", err instanceof Error ? err.message : err)
    return null
  }
}

/**
 * Reads all of `ai_model_config` (RLS applies: the caller's own client, no
 * service_role) with a 60s in-memory cache, and resolves one capability out
 * of it. Never throws — every failure mode (RLS denies anon, table missing,
 * timeout, network error) degrades to `DEFAULT_MODEL_CONFIG` (ADR 0004 §5),
 * because by the time this is called `consume_ai_quota` has already gated
 * the request; refusing to serve a default model here would be strictly
 * worse than falling back to it.
 */
export async function loadModelChain(supabase: SupabaseClient, capability: AiCapability): Promise<ModelChain> {
  const now = Date.now()

  if (cache && cache.expiresAt > now) {
    return resolveModelChain(capability, cache.rows)
  }

  if (!inFlight) {
    inFlight = fetchRows(supabase).finally(() => {
      inFlight = null
    })
  }

  const rows = await inFlight
  cache = { rows, expiresAt: now + (rows === null ? ERROR_CACHE_TTL_MS : CACHE_TTL_MS) }

  return resolveModelChain(capability, rows)
}

/** Test-only: clears the module-level cache between test cases. */
export function __resetModelConfigCache(): void {
  cache = null
  inFlight = null
}
