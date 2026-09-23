import type { SupabaseClient } from "@supabase/supabase-js"
import { z } from "zod"
import type { Database } from "@/lib/types/supabase"
import type { AiFeature } from "./features"

const quotaRowSchema = z.object({
  allowed: z.boolean(),
  used: z.number().int(),
  quota_limit: z.number().int().nullable(),
  resets_at: z.string(),
  reason: z.enum(["ok", "quota", "budget"])
})

export interface AiQuotaStatus {
  allowed: boolean
  used: number
  /** `null` = unlimited. */
  limit: number | null
  /** `null` = unlimited. */
  remaining: number | null
  resetsAt: string
  /** Why it was denied: the user's own credits, or the platform's monthly budget. */
  reason: "ok" | "quota" | "budget"
}

export class AiQuotaUnavailableError extends Error {
  constructor(cause: unknown) {
    super("AI quota check unavailable")
    this.cause = cause
  }
}

function toStatus(data: unknown): AiQuotaStatus {
  const row = quotaRowSchema.parse(Array.isArray(data) ? data[0] : data)
  return {
    allowed: row.allowed,
    used: row.used,
    limit: row.quota_limit,
    remaining: row.quota_limit === null ? null : Math.max(row.quota_limit - row.used, 0),
    resetsAt: row.resets_at,
    reason: row.reason
  }
}

/**
 * Atomically takes one credit of `feature` for the logged-in user.
 *
 * Call this BEFORE the model call: the credit is what authorizes spending
 * money. Fails closed (throws) if the check itself fails — an AI call without
 * a working limit is exactly the unbounded-cost scenario this exists to stop.
 */
export async function consumeAiQuota(
  supabase: SupabaseClient<Database>,
  feature: AiFeature
): Promise<AiQuotaStatus> {
  const { data, error } = await supabase.rpc("consume_ai_quota", { p_feature: feature })
  if (error) throw new AiQuotaUnavailableError(error)
  return toStatus(data)
}

/** Read-only quota status for the UI ("7 de 10 buscas este mês"). */
export async function getAiQuota(
  supabase: SupabaseClient<Database>,
  feature: AiFeature
): Promise<AiQuotaStatus> {
  const { data, error } = await supabase.rpc("get_ai_quota", { p_feature: feature })
  if (error) throw new AiQuotaUnavailableError(error)
  return toStatus(data)
}
