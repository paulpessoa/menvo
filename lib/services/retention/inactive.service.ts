const DAY_MS = 24 * 60 * 60 * 1000

export const INACTIVE_POLICY = {
  /** Days of inactivity required before enrolling and sending the 30-day notice. */
  inactivityDays: 365,
  /** Days between the warning and the scheduled deletion. */
  noticeLeadDays: 30,
} as const

export interface InactiveCandidate {
  userId: string
  lastSignInAt: string
}

export interface InactiveQueueRow {
  userId: string
  lastSignInAt: string
  noticeThirtyDaySentAt: string | null
  scheduledDeletionAt: string | null
}

export interface InactiveState {
  /** Users who haven't signed in for > 365 days */
  candidates: InactiveCandidate[]
  /** Current inactive_accounts_queue rows */
  queue: InactiveQueueRow[]
}

export type InactiveAction =
  | { kind: "release"; userId: string }
  | { kind: "enroll_and_notice"; userId: string; lastSignInAt: string }
  | { kind: "delete"; userId: string }

function addDays(iso: string, days: number): Date {
  return new Date(new Date(iso).getTime() + days * DAY_MS)
}

/**
 * Turns the current state of inactive accounts into actions.
 * - If a user in the queue has signed in recently (lastSignInAt changed), release them.
 * - If a user is a candidate and not in the queue, enroll and send the 30-day notice immediately.
 * - If a user is in the queue and 30 days have passed since notice, delete them.
 */
export function planInactiveActions(state: InactiveState, now: Date): InactiveAction[] {
  const actions: InactiveAction[] = []
  
  const candidateMap = new Map(state.candidates.map(c => [c.userId, c]))
  const queueMap = new Map(state.queue.map(q => [q.userId, q]))

  // 1. Releases and Deletions for existing queue rows
  for (const row of state.queue) {
    const candidate = candidateMap.get(row.userId)
    
    // If they are no longer a candidate (e.g. they signed in recently, meaning
    // their last_sign_in_at is now < 365 days ago, so they weren't returned in state.candidates),
    // OR if their last_sign_in_at in the DB differs from what we recorded in the queue (meaning they logged in after we enrolled them).
    if (!candidate || new Date(candidate.lastSignInAt).getTime() > new Date(row.lastSignInAt).getTime()) {
      actions.push({ kind: "release", userId: row.userId })
      continue
    }

    // They are still inactive. Have they reached deletion?
    if (row.scheduledDeletionAt) {
      if (now >= new Date(row.scheduledDeletionAt)) {
        actions.push({ kind: "delete", userId: row.userId })
      }
    }
  }

  // 2. Enrollments for candidates not yet in the queue
  for (const candidate of state.candidates) {
    if (!queueMap.has(candidate.userId)) {
      // For inactive accounts, we immediately send the notice when they cross the 1-year mark.
      actions.push({ 
        kind: "enroll_and_notice", 
        userId: candidate.userId, 
        lastSignInAt: candidate.lastSignInAt 
      })
    }
  }

  return actions
}
