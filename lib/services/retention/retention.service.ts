/**
 * Automatic retention/deletion of imported (JotForm) accounts that were
 * reengagement-invited but never activated (never signed in).
 *
 * This file only contains the *decision* logic (`planRetentionActions`), a
 * pure function with no I/O so every timing edge case can be tested without
 * mocking Supabase. Execution (loading state, claiming rows, sending e-mails,
 * calling `deleteUserCompletely`) is added in a later phase.
 *
 * See docs/domains/account-retention.md for the full design and the
 * invariants each timing rule below is meant to enforce.
 */

const DAY_MS = 24 * 60 * 60 * 1000

export const RETENTION_POLICY = {
  /** Days after the first invite before the 30-day warning is due. */
  firstNoticeAfterDays: 60,
  /** Days between the 30-day warning and the scheduled deletion. */
  noticeLeadDays: 30,
  /** Days between the last warning and the scheduled deletion. */
  lastNoticeLeadDays: 1,
  /** Days after the first invite before deleting someone who opted out (no warnings sent). */
  optedOutDeleteAfterDays: 90
} as const

/** A JotForm profile eligible to enter the retention queue, or already tracked by it. */
export interface RetentionCandidate {
  userId: string
  /** Campaign of the earliest invite this person received — becomes the enrollment campaign. */
  campaign: string
  /** `sent_at` of that earliest invite — becomes `clock_started_at` on enrollment. */
  firstInvitedAt: string
  /** True if `profiles.email_opt_out_at` is set or the e-mail is in `email_suppressions`. */
  optedOut: boolean
}

/** Mirrors one row of `account_retention`. */
export interface RetentionQueueRow {
  userId: string
  campaign: string
  clockStartedAt: string
  noticeThirtyDaySentAt: string | null
  scheduledDeletionAt: string | null
  noticeOneDaySentAt: string | null
}

export interface RetentionState {
  /** Every JotForm profile that has received at least one reengagement invite. */
  candidates: RetentionCandidate[]
  /** Current `account_retention` rows (a subset of `candidates`, once enrolled). */
  queue: RetentionQueueRow[]
  /** `auth.users.id` of everyone who has ever signed in. */
  signedInUserIds: Set<string>
}

export type RetentionAction =
  | { kind: "release"; userId: string }
  | { kind: "enroll"; userId: string; campaign: string; clockStartedAt: string }
  | { kind: "delete"; userId: string; notify: boolean }
  | { kind: "notice_1d"; userId: string }
  | { kind: "notice_30d"; userId: string }

function addDays(iso: string, days: number): Date {
  return new Date(new Date(iso).getTime() + days * DAY_MS)
}

function subDays(iso: string, days: number): Date {
  return addDays(iso, -days)
}

function laterOf(a: Date, b: Date): Date {
  return a.getTime() >= b.getTime() ? a : b
}

/**
 * Decides what to do with one already-enrolled queue row, given the account
 * hasn't been released this run. Returns at most one action — a row is
 * always in exactly one stage (waiting for the 30-day notice, waiting for
 * the 1-day notice, waiting for deletion) or opted out, which follows its
 * own, warning-free 90-day clock.
 */
function decideForQueueRow(row: RetentionQueueRow, optedOut: boolean, now: Date): RetentionAction | null {
  if (optedOut) {
    const deleteAt = addDays(row.clockStartedAt, RETENTION_POLICY.optedOutDeleteAfterDays)
    return now >= deleteAt ? { kind: "delete", userId: row.userId, notify: false } : null
  }

  if (!row.noticeThirtyDaySentAt) {
    const noticeAt = addDays(row.clockStartedAt, RETENTION_POLICY.firstNoticeAfterDays)
    return now >= noticeAt ? { kind: "notice_30d", userId: row.userId } : null
  }

  if (!row.noticeOneDaySentAt) {
    // Invariant: scheduledDeletionAt is set whenever noticeThirtyDaySentAt is
    // (see the `retention_schedule_set` DB constraint), so this is always non-null here.
    if (!row.scheduledDeletionAt) return null
    const oneDayNoticeAt = subDays(row.scheduledDeletionAt, RETENTION_POLICY.lastNoticeLeadDays)
    return now >= oneDayNoticeAt ? { kind: "notice_1d", userId: row.userId } : null
  }

  // Both notices sent: delete no earlier than the schedule AND no earlier
  // than one day after the 1-day notice actually went out — a late 1-day
  // notice (e.g. after a Brevo outage) pushes deletion back instead of
  // deleting the instant it finally sends.
  if (!row.scheduledDeletionAt) return null
  const deleteAt = laterOf(new Date(row.scheduledDeletionAt), addDays(row.noticeOneDaySentAt, 1))
  return now >= deleteAt ? { kind: "delete", userId: row.userId, notify: true } : null
}

/**
 * Turns the current state of the imported-accounts cohort into the list of
 * actions a retention run should take, in the order they should execute:
 * releases first (someone signed in — never delete or notice them this
 * run), then new enrollments, then deletions, then the 1-day notice, then
 * the 30-day notice. Pure and side-effect free so every timing rule in
 * docs/domains/account-retention.md §2 can be unit tested directly.
 */
export function planRetentionActions(state: RetentionState, now: Date): RetentionAction[] {
  const queueByUser = new Map(state.queue.map(row => [row.userId, row]))
  const optedOutByUser = new Map(state.candidates.map(c => [c.userId, c.optedOut]))

  const releases: RetentionAction[] = []
  const releasedUserIds = new Set<string>()
  for (const row of state.queue) {
    if (state.signedInUserIds.has(row.userId)) {
      releases.push({ kind: "release", userId: row.userId })
      releasedUserIds.add(row.userId)
    }
  }

  const enrollments: RetentionAction[] = []
  for (const candidate of state.candidates) {
    if (state.signedInUserIds.has(candidate.userId)) continue
    if (queueByUser.has(candidate.userId)) continue
    enrollments.push({
      kind: "enroll",
      userId: candidate.userId,
      campaign: candidate.campaign,
      clockStartedAt: candidate.firstInvitedAt
    })
  }

  const deletions: RetentionAction[] = []
  const notices1d: RetentionAction[] = []
  const notices30d: RetentionAction[] = []
  for (const row of state.queue) {
    if (releasedUserIds.has(row.userId)) continue
    if (state.signedInUserIds.has(row.userId)) continue
    // Only act on rows whose profile is still a current JotForm candidate, so
    // a stale or hand-edited queue row can never notice or delete anyone else.
    const optedOut = optedOutByUser.get(row.userId)
    if (optedOut === undefined) continue

    const action = decideForQueueRow(row, optedOut, now)
    if (!action) continue
    if (action.kind === "delete") deletions.push(action)
    else if (action.kind === "notice_1d") notices1d.push(action)
    else if (action.kind === "notice_30d") notices30d.push(action)
  }

  return [...releases, ...enrollments, ...deletions, ...notices1d, ...notices30d]
}
