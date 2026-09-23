import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import type { AiFeature } from "./features"

export type AiCallStatus = "ok" | "error" | "fallback"

/**
 * One model call (or one deterministic fallback), as the provider reported it.
 * Failed attempts are recorded too: a timeout can still be billed, and the
 * error/fallback rate is itself a number worth watching.
 */
export interface AiCallRecord {
  provider: string
  model: string
  inputTokens: number
  outputTokens: number
  cachedInputTokens: number
  latencyMs: number
  status: AiCallStatus
  errorCode?: string
}

/**
 * Persists AI calls as `ai_usage_events`; cost is computed in the database
 * from `ai_model_pricing`, so a price change never requires a deploy.
 *
 * Sends `AI_METERING_KEY` because usage numbers must come from the server:
 * if users could call `record_ai_usage` themselves, one forged row would
 * exhaust the global `ai_budget` and block AI for everyone.
 *
 * Never throws: losing a metering row must not break the user's request.
 * Run it inside `after()` (or at the end of a stream) so it adds no latency.
 */
export async function recordAiCalls(
  supabase: SupabaseClient<Database>,
  feature: AiFeature,
  calls: AiCallRecord[],
  runId: string = crypto.randomUUID()
): Promise<void> {
  const serverKey = process.env.AI_METERING_KEY
  if (!serverKey) {
    console.warn(`[ai-metering] AI_METERING_KEY is not set; ${calls.length} ${feature} call(s) not recorded`)
    return
  }

  const results = await Promise.allSettled(
    calls.map((call) =>
      supabase.rpc("record_ai_usage", {
        p_server_key: serverKey,
        p_feature: feature,
        p_provider: call.provider,
        p_model: call.model,
        p_input_tokens: call.inputTokens,
        p_output_tokens: call.outputTokens,
        p_cached_input_tokens: call.cachedInputTokens,
        p_latency_ms: Math.round(call.latencyMs),
        p_status: call.status,
        p_error_code: call.errorCode,
        p_run_id: runId
      })
    )
  )
  for (const r of results) {
    const error = r.status === "rejected" ? r.reason : r.value.error
    if (error) console.warn(`[ai-metering] failed to record ${feature} usage:`, error)
  }
}
