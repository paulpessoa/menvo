import type { SupabaseClient } from "@supabase/supabase-js"
import { z } from "zod"
import type { Database } from "@/lib/types/supabase"

const num = z.coerce.number().nullable().transform((v) => v ?? 0)

const byModelSchema = z.object({
  feature: z.string(),
  provider: z.string(),
  model: z.string(),
  calls: num,
  errors: num,
  fallbacks: num,
  users: num,
  input_tokens: num,
  output_tokens: num,
  cost_usd: num,
  unpriced_calls: num,
  p50_latency_ms: z.coerce.number().nullable()
})

const byUserSchema = z.object({
  user_id: z.string().nullable(),
  full_name: z.string().nullable(),
  calls: num,
  cost_usd: num
})

export type AiUsageByModel = z.infer<typeof byModelSchema>
export type AiUsageByUser = z.infer<typeof byUserSchema>

export interface AiUsageReport {
  month: string
  /** Platform-wide monthly ceiling in USD (`ai_budget`); `null` = no cap. */
  budgetUsd: number | null
  totals: { costUsd: number; calls: number; errors: number; fallbacks: number; unpricedCalls: number }
  byModel: AiUsageByModel[]
  topUsers: AiUsageByUser[]
}

/**
 * Monthly AI cost report for the admin panel. Reads the aggregated views
 * (`security_invoker`, so RLS decides who sees what — only admins see every
 * user). Aggregation lives in SQL because PostgREST aggregates are disabled.
 *
 * @param month First day of the month, `YYYY-MM-01`.
 */
export async function getAiUsageReport(
  supabase: SupabaseClient<Database>,
  month: string
): Promise<AiUsageReport> {
  const [models, users, budget] = await Promise.all([
    supabase.from("ai_usage_monthly").select("*").eq("month", month).order("cost_usd", { ascending: false }),
    supabase
      .from("ai_usage_by_user_monthly")
      .select("user_id, full_name, calls, cost_usd")
      .eq("month", month)
      .order("cost_usd", { ascending: false })
      .limit(20),
    supabase
      .from("ai_budget")
      .select("limit_usd")
      .lte("month", month)
      .order("month", { ascending: false })
      .limit(1)
      .maybeSingle()
  ])
  if (models.error) throw models.error
  if (users.error) throw users.error
  if (budget.error) throw budget.error

  const byModel = z.array(byModelSchema).parse(models.data)
  const topUsers = z.array(byUserSchema).parse(users.data)

  const totals = byModel.reduce(
    (acc, r) => ({
      costUsd: acc.costUsd + r.cost_usd,
      calls: acc.calls + r.calls,
      errors: acc.errors + r.errors,
      fallbacks: acc.fallbacks + r.fallbacks,
      unpricedCalls: acc.unpricedCalls + r.unpriced_calls
    }),
    { costUsd: 0, calls: 0, errors: 0, fallbacks: 0, unpricedCalls: 0 }
  )

  const budgetUsd = budget.data ? Number(budget.data.limit_usd) : null
  return { month, budgetUsd, totals, byModel, topUsers }
}
