import type { SupabaseClient } from "@supabase/supabase-js"
import { z } from "zod"
import type { Database } from "@/lib/types/supabase"
import { createAdminAiUsageRepository } from "@/lib/repositories/admin-ops.repository"
import { assertAdmin } from "@/lib/services/admin/assert-admin"

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
 * Monthly AI cost report for the admin panel. Confirms the caller is an admin
 * first, then reads the aggregated views through the repository (they are
 * `security_invoker`, so RLS still decides who sees what). Aggregation lives
 * in SQL because PostgREST aggregates are disabled.
 *
 * @param month First day of the month, `YYYY-MM-01`.
 * @throws {AdminForbiddenError} when the caller is not an admin.
 */
export async function getAiUsageReport(
  supabase: SupabaseClient<Database>,
  month: string
): Promise<AiUsageReport> {
  await assertAdmin(supabase)
  const repo = createAdminAiUsageRepository(supabase)
  const [models, users, budgetUsd] = await Promise.all([
    repo.listByModel(month),
    repo.listTopUsers(month),
    repo.getBudgetLimit(month)
  ])

  const byModel = z.array(byModelSchema).parse(models)
  const topUsers = z.array(byUserSchema).parse(users)

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

  return { month, budgetUsd, totals, byModel, topUsers }
}
