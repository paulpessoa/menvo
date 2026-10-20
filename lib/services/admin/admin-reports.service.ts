/**
 * Camada 7 · Service do relatório de cadastros (admin)
 * Regra: `assertAdmin` primeiro, depois contagens e crescimento diário pela
 * sessão do admin (RLS de `profiles`). Agrega por dia aqui, não no banco,
 * porque o PostgREST não tem `group by`.
 * Não faz: criar client nem montar resposta HTTP.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createAdminReportsRepository } from "@/lib/repositories/admin-ops.repository"
import { assertAdmin } from "./assert-admin"

export interface AdminReport {
  overview: { totalUsers: number; totalMentors: number; totalMentees: number }
  growth: { users: Array<{ date: string; count: number }> }
}

/**
 * Totais de usuários/mentores/mentorados e cadastros por dia desde `since`.
 *
 * @param db Client da sessão do admin.
 * @param since Data `YYYY-MM-DD` (já validada na rota).
 * @throws {AdminForbiddenError} se quem chama não for admin.
 */
export async function getAdminReport(db: SupabaseClient<Database>, since: string): Promise<AdminReport> {
  await assertAdmin(db)
  const repo = createAdminReportsRepository(db)
  const [totalUsers, totalMentors, totalMentees, signups] = await Promise.all([
    repo.countProfiles(),
    repo.countByRole("mentor"),
    repo.countByRole("mentee"),
    repo.listSignupDates(since)
  ])

  const counts: Record<string, number> = {}
  for (const row of signups) {
    if (!row.created_at) continue
    const date = new Date(row.created_at)
    if (isNaN(date.getTime())) continue
    const key = date.toISOString().split("T")[0]
    counts[key] = (counts[key] || 0) + 1
  }
  const users = Object.entries(counts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return { overview: { totalUsers, totalMentors, totalMentees }, growth: { users } }
}
