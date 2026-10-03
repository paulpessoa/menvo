import type { AdminOverview, WeeklySessions, WeeklySignups } from "./overview.types"

const DAY_MS = 24 * 60 * 60 * 1000

/** Monday (UTC) of the week containing `date`, as YYYY-MM-DD. Weeks start on Monday to match pt-BR calendars. */
export function weekStartUtc(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const offset = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - offset)
  return d.toISOString().slice(0, 10)
}

/**
 * The last `count` week starts, oldest first, current week included. Every
 * bucket exists even when empty, so a quiet week shows as a zero bar
 * instead of disappearing from the axis.
 */
export function buildWeeks(now: Date, count: number): string[] {
  const current = new Date(`${weekStartUtc(now)}T00:00:00Z`)
  return Array.from({ length: count }, (_, i) =>
    new Date(current.getTime() - (count - 1 - i) * 7 * DAY_MS).toISOString().slice(0, 10)
  )
}

/**
 * Signups per week split by side of the marketplace. A mentor candidate is
 * still role `mentee` until approved (docs/domains/mentor-verification.md),
 * so "mentors" here means approved mentors only.
 */
export function bucketSignups(rows: { created_at: string; roles: string[] }[], weeks: string[]): WeeklySignups[] {
  const buckets = new Map(weeks.map(w => [w, { week: w, mentees: 0, mentors: 0, other: 0 }]))
  for (const row of rows) {
    const bucket = buckets.get(weekStartUtc(new Date(row.created_at)))
    if (!bucket) continue
    if (row.roles.includes("mentor")) bucket.mentors++
    else if (row.roles.includes("mentee")) bucket.mentees++
    else bucket.other++
  }
  return Array.from(buckets.values())
}

export type SessionOutcome = "done" | "scheduled" | "pending" | "cancelled"

/**
 * Collapses raw appointment status into what the business cares about.
 * Nothing flips `confirmed` to `completed` automatically, so a confirmed
 * session whose time has passed is counted as done.
 */
export function classifySession(status: string, scheduledAt: string, now: Date): SessionOutcome | null {
  if (status === "completed") return "done"
  if (status === "confirmed") return new Date(scheduledAt) < now ? "done" : "scheduled"
  if (status === "pending") return "pending"
  if (status === "cancelled" || status === "canceled" || status === "rejected") return "cancelled"
  return null
}

/** Session requests per week (by request date), split by outcome. */
export function bucketSessions(
  rows: { created_at: string; status: string; scheduled_at: string }[],
  weeks: string[],
  now: Date
): WeeklySessions[] {
  const buckets = new Map(weeks.map(w => [w, { week: w, done: 0, scheduled: 0, pending: 0, cancelled: 0 }]))
  for (const row of rows) {
    const bucket = buckets.get(weekStartUtc(new Date(row.created_at)))
    const outcome = classifySession(row.status, row.scheduled_at, now)
    if (bucket && outcome) bucket[outcome]++
  }
  return Array.from(buckets.values())
}

/** Counts rows whose `created_at` falls in [now - to days, now - from days). */
export function countInWindow(rows: { created_at: string }[], now: Date, fromDays: number, toDays: number): number {
  const upper = now.getTime() - fromDays * DAY_MS
  const lower = now.getTime() - toDays * DAY_MS
  return rows.filter(r => {
    const t = new Date(r.created_at).getTime()
    return t >= lower && t < upper
  }).length
}

/**
 * Running AI spend for each day of the month up to today. Cumulative (not
 * daily) because the question it answers is "will we cross the budget?",
 * and the budget is a monthly ceiling on the same axis.
 */
export function cumulativeDailyCost(
  rows: { created_at: string; cost_usd: number | null }[],
  monthStart: string,
  now: Date
): AdminOverview["ai"]["cumulativeByDay"] {
  const perDay = new Map<string, number>()
  for (const row of rows) {
    const day = row.created_at.slice(0, 10)
    perDay.set(day, (perDay.get(day) ?? 0) + (row.cost_usd ?? 0))
  }
  const result: AdminOverview["ai"]["cumulativeByDay"] = []
  let running = 0
  const today = now.toISOString().slice(0, 10)
  for (let d = new Date(`${monthStart}T00:00:00Z`); ; d = new Date(d.getTime() + DAY_MS)) {
    const day = d.toISOString().slice(0, 10)
    if (day > today || day.slice(0, 7) !== monthStart.slice(0, 7)) break
    running += perDay.get(day) ?? 0
    result.push({ day, costUsd: Number(running.toFixed(4)) })
  }
  return result
}

/** Star distribution (5 → 1) and the weighted average; null average when there are no ratings. */
export function summarizeRatings(countsByStar: Record<number, number>): Pick<AdminOverview["ratings"], "distribution" | "average"> {
  const distribution = [5, 4, 3, 2, 1].map(stars => ({ stars, count: countsByStar[stars] ?? 0 }))
  const total = distribution.reduce((acc, r) => acc + r.count, 0)
  const weighted = distribution.reduce((acc, r) => acc + r.stars * r.count, 0)
  return { distribution, average: total ? Number((weighted / total).toFixed(2)) : null }
}

/**
 * Same stage precedence as GET /api/admin/retention (opt-out wins, then the
 * most advanced notice), so the dashboard and the retention page agree.
 */
export function retentionStages(
  rows: { notice_30d_sent_at: string | null; notice_1d_sent_at: string | null; scheduled_deletion_at: string | null; opted_out: boolean }[],
  now: Date
): Omit<AdminOverview["retention"], "inactiveNotified"> {
  const stages = { waiting: 0, notice30d: 0, notice1d: 0, optedOut: 0, deletionsNext7d: 0 }
  const horizon = now.getTime() + 7 * DAY_MS
  for (const row of rows) {
    if (row.opted_out) stages.optedOut++
    else if (row.notice_1d_sent_at) stages.notice1d++
    else if (row.notice_30d_sent_at) stages.notice30d++
    else stages.waiting++
    if (row.scheduled_deletion_at && new Date(row.scheduled_deletion_at).getTime() <= horizon) stages.deletionsNext7d++
  }
  return stages
}
