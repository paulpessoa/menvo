import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import {
  buildWeeks,
  bucketSessions,
  bucketSignups,
  countInWindow,
  cumulativeDailyCost,
  retentionStages,
  summarizeRatings
} from "./overview.aggregate"
import { OVERVIEW_WEEKS, type AdminOverview } from "./overview.types"

type Db = SupabaseClient<Database>
type QueryResult<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>
type CountResult = PromiseLike<{ count: number | null; error: { message: string } | null }>

const PAGE = 1000
/** Hard stop so a runaway table can never turn the dashboard into a full scan. */
const MAX_ROWS = 50_000

/** PostgREST caps responses at 1000 rows; page through so weekly totals aren't silently truncated. */
async function fetchAll<T>(page: (from: number, to: number) => QueryResult<T>): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE) break
  }
  return rows
}

async function headCount(query: CountResult): Promise<number> {
  const { count, error } = await query
  if (error) throw new Error(error.message)
  return count ?? 0
}

const daysAgo = (now: Date, days: number) => new Date(now.getTime() - days * 86_400_000).toISOString()

/**
 * Everything /dashboard/admin charts, in one round trip. Each section mirrors
 * the definition used by its own admin page (pending = verification_status,
 * retention stages = /api/admin/retention) so the numbers match after a click.
 *
 * @param db RLS-bound client of the calling admin (`is_admin()` policies).
 * @param serviceDb service-role client, used only for `appointments` and
 *   `inactive_accounts_queue`, which the existing admin routes also read with
 *   it. Callers must run `requireAdmin` first.
 */
export async function getAdminOverview(db: Db, serviceDb: SupabaseClient, now = new Date()): Promise<AdminOverview> {
  const weeks = buildWeeks(now, OVERVIEW_WEEKS)
  const windowStart = `${weeks[0]}T00:00:00Z`
  const month = now.toISOString().slice(0, 7)
  const monthStart = `${month}-01`
  const profiles = () => db.from("profiles").select("*", { count: "exact", head: true })
  const byRole = (role: string) =>
    db.from("profiles").select("user_roles!inner(roles!inner(name))", { count: "exact", head: true }).eq("user_roles.roles.name", role)
  const feedbackStars = (stars: number) =>
    db.from("appointment_feedbacks").select("*", { count: "exact", head: true }).eq("rating", stars)
  const leads = (status: string) => db.from("organization_leads").select("*", { count: "exact", head: true }).eq("status", status)

  const [
    signupRows, sessionRows, aiRows, retentionRows,
    totalUsers, new30d, prev30d, verifiedMentors, mentees,
    pending, approved, rejected,
    s5, s4, s3, s2, s1, pendingModeration,
    activeOrgs, leadsNew, leadsContacted, leadsClosed,
    inactiveNotified, aiByModel, budget
  ] = await Promise.all([
    fetchAll((from, to) =>
      db.from("profiles").select("created_at, user_roles(roles(name))").gte("created_at", windowStart).range(from, to)
    ),
    fetchAll<{ created_at: string; status: string; scheduled_at: string }>((from, to) =>
      serviceDb.from("appointments").select("created_at, status, scheduled_at").gte("created_at", windowStart).range(from, to)
    ),
    fetchAll((from, to) =>
      db.from("ai_usage_events").select("created_at, cost_usd").gte("created_at", monthStart).range(from, to)
    ),
    fetchAll((from, to) =>
      db
        .from("account_retention")
        .select("notice_30d_sent_at, notice_1d_sent_at, scheduled_deletion_at, profile:profiles!inner(email_opt_out_at)")
        .range(from, to)
    ),
    headCount(profiles()),
    headCount(profiles().gte("created_at", daysAgo(now, 30))),
    headCount(profiles().gte("created_at", daysAgo(now, 60)).lt("created_at", daysAgo(now, 30))),
    headCount(byRole("mentor").eq("verified", true)),
    headCount(byRole("mentee")),
    headCount(profiles().eq("verification_status", "pending")),
    // Role filter on purpose: the JotForm import left ~560 mentees with
    // verification_status = 'approved', which are not mentor approvals.
    headCount(byRole("mentor").eq("verification_status", "approved")),
    headCount(profiles().eq("verification_status", "rejected")),
    headCount(feedbackStars(5)),
    headCount(feedbackStars(4)),
    headCount(feedbackStars(3)),
    headCount(feedbackStars(2)),
    headCount(feedbackStars(1)),
    headCount(db.from("appointment_feedbacks").select("*", { count: "exact", head: true }).eq("status", "pending")),
    headCount(db.from("organizations").select("*", { count: "exact", head: true }).eq("status", "active")),
    headCount(leads("new")),
    headCount(leads("contacted")),
    headCount(leads("closed")),
    headCount(serviceDb.from("inactive_accounts_queue").select("*", { count: "exact", head: true }).not("notice_30d_sent_at", "is", null)),
    db.from("ai_usage_monthly").select("feature, calls, cost_usd").eq("month", monthStart),
    db.from("ai_budget").select("limit_usd").lte("month", monthStart).order("month", { ascending: false }).limit(1).maybeSingle()
  ])
  if (aiByModel.error) throw new Error(aiByModel.error.message)
  if (budget.error) throw new Error(budget.error.message)

  const byFeature = new Map<string, { feature: string; costUsd: number; calls: number }>()
  for (const row of aiByModel.data ?? []) {
    const key = row.feature ?? "outros"
    const entry = byFeature.get(key) ?? { feature: key, costUsd: 0, calls: 0 }
    entry.costUsd += row.cost_usd ?? 0
    entry.calls += row.calls ?? 0
    byFeature.set(key, entry)
  }
  const cumulativeByDay = cumulativeDailyCost(aiRows, monthStart, now)

  const sessionsByWeek = bucketSessions(sessionRows, weeks, now)
  const windowTotals = sessionsByWeek.reduce(
    (acc, w) => ({ all: acc.all + w.done + w.scheduled + w.pending + w.cancelled, cancelled: acc.cancelled + w.cancelled }),
    { all: 0, cancelled: 0 }
  )

  return {
    generatedAt: now.toISOString(),
    users: { total: totalUsers, new30d, prev30d, verifiedMentors, mentees },
    signupsByWeek: bucketSignups(
      signupRows.map(r => ({
        created_at: r.created_at,
        roles: (r.user_roles ?? []).map(ur => ur.roles?.name ?? "").filter(Boolean)
      })),
      weeks
    ),
    sessions: {
      last30d: countInWindow(sessionRows, now, 0, 30),
      prev30d: countInWindow(sessionRows, now, 30, 60),
      byWeek: sessionsByWeek,
      cancelRate: windowTotals.all ? windowTotals.cancelled / windowTotals.all : null
    },
    mentorPipeline: { pending, approved, rejected },
    ratings: { ...summarizeRatings({ 5: s5, 4: s4, 3: s3, 2: s2, 1: s1 }), pendingModeration },
    ai: {
      month,
      spentUsd: cumulativeByDay.at(-1)?.costUsd ?? 0,
      budgetUsd: budget.data ? Number(budget.data.limit_usd) : null,
      cumulativeByDay,
      byFeature: Array.from(byFeature.values()).sort((a, b) => b.costUsd - a.costUsd)
    },
    organizations: { active: activeOrgs, leadsNew, leadsContacted, leadsClosed },
    retention: {
      ...retentionStages(
        retentionRows.map(r => ({ ...r, opted_out: !!r.profile?.email_opt_out_at })),
        now
      ),
      inactiveNotified
    }
  }
}
