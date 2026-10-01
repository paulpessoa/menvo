import { createServiceRoleClient, ensureServerSide } from "@/lib/utils/supabase/service-role"
import { deleteUserCompletely } from "@/lib/services/admin/delete-user.service"
import {
  sendInactiveNotice,
  sendInactiveDeletionConfirmation
} from "@/lib/email/brevo"
import {
  planInactiveActions,
  INACTIVE_POLICY,
  type InactiveAction,
  type InactiveCandidate,
  type InactiveQueueRow,
  type InactiveState
} from "@/lib/services/retention/inactive.service"

export interface InactiveRunOptions {
  mode: "dry_run" | "live"
  maxEmails: number
  maxDeletions: number
}

export interface InactiveReport {
  mode: InactiveRunOptions["mode"]
  planned: Record<InactiveAction["kind"], number>
  released: string[]
  enrolled: string[]
  deleted: string[]
  errors: { userId: string; action: InactiveAction["kind"]; message: string }[]
}

function emptyReport(mode: InactiveRunOptions["mode"]): InactiveReport {
  return {
    mode,
    planned: { release: 0, enroll_and_notice: 0, delete: 0 },
    released: [],
    enrolled: [],
    deleted: [],
    errors: []
  }
}

function addDays(iso: string, days: number): Date {
  return new Date(new Date(iso).getTime() + days * 24 * 60 * 60 * 1000)
}

export async function runInactiveRetention(opts: InactiveRunOptions): Promise<InactiveReport> {
  ensureServerSide()
  const supabase = createServiceRoleClient()
  const report = emptyReport(opts.mode)
  const now = new Date()
  
  // 1. Load state
  const { data: inactiveUsers, error: usersError } = await supabase
    .from("vw_inactive_users")
    .select("id, last_activity_at")

  if (usersError) throw usersError

  const { data: queueRows, error: queueError } = await supabase
    .from("inactive_accounts_queue")
    .select("*")

  if (queueError) throw queueError

  // Fetch full_name and email for those who are candidates or in queue, to avoid N+1
  const allIds = new Set([...inactiveUsers.map(u => u.id), ...queueRows.map(r => r.user_id)])
  const idsArray = Array.from(allIds)
  
  // Supabase limits IN clauses. But we assume we won't have millions. Let's do it in chunks of 500 if necessary, but for now simple query.
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", idsArray)

  if (profilesError) throw profilesError
  
  const profilesById = new Map(profiles.map(p => [p.id, { email: p.email, full_name: p.full_name }]))

  const state: InactiveState = {
    candidates: inactiveUsers.map(u => ({
      userId: u.id,
      lastSignInAt: u.last_activity_at
    })),
    queue: queueRows.map(r => ({
      userId: r.user_id,
      lastSignInAt: r.last_sign_in_at,
      noticeThirtyDaySentAt: r.notice_30d_sent_at,
      scheduledDeletionAt: r.scheduled_deletion_at
    }))
  }

  // 2. Plan
  const actions = planInactiveActions(state, now)

  // 3. Execute actions (releases -> enroll -> notice -> delete)
  // Deletions first to free them up, then notices.
  
  // Extract actions by type
  const releases = actions.filter(a => a.kind === "release")
  const enrolls = actions.filter(a => a.kind === "enroll_and_notice")
  const deletions = actions.filter(a => a.kind === "delete")

  // Releases
  for (const act of releases) {
    report.planned.release++
    if (opts.mode === "live") {
      const { error } = await supabase.from("inactive_accounts_queue").delete().eq("user_id", act.userId)
      if (error) {
        report.errors.push({ userId: act.userId, action: "release", message: error.message })
        continue
      }
    }
    report.released.push(act.userId)
  }

  // Deletions
  let deletionsCount = 0
  for (const act of deletions) {
    report.planned.delete++
    if (deletionsCount >= opts.maxDeletions) continue // Defer
    
    const profile = profilesById.get(act.userId)
    if (!profile) continue

    if (opts.mode === "live") {
      try {
        await deleteUserCompletely(act.userId, { source: "inactivity_policy" })
        if (profile.email) {
          await sendInactiveDeletionConfirmation({ name: profile.full_name || "", email: profile.email })
        }
        report.deleted.push(act.userId)
        deletionsCount++
      } catch (err: any) {
        report.errors.push({ userId: act.userId, action: "delete", message: err.message })
      }
    } else {
      report.deleted.push(act.userId)
      deletionsCount++
    }
  }

  // Enrolls and Notices
  let emailsCount = 0
  for (const act of enrolls) {
    if (act.kind !== "enroll_and_notice") continue
    report.planned.enroll_and_notice++
    if (emailsCount >= opts.maxEmails) continue // Defer

    const profile = profilesById.get(act.userId)
    if (!profile?.email) continue // skip if they have no email

    const scheduledDate = addDays(now.toISOString(), INACTIVE_POLICY.noticeLeadDays)

    if (opts.mode === "live") {
      // Send email first
      const emailResult = await sendInactiveNotice({
        name: profile.full_name || "",
        email: profile.email,
        deletionDate: scheduledDate.toISOString()
      })

      if (!emailResult.success) {
        report.errors.push({ userId: act.userId, action: "enroll_and_notice", message: emailResult.error || "Email failed" })
        continue
      }

      // Record in queue
      const { error } = await supabase.from("inactive_accounts_queue").insert({
        user_id: act.userId,
        last_sign_in_at: act.lastSignInAt,
        notice_30d_sent_at: now.toISOString(),
        scheduled_deletion_at: scheduledDate.toISOString()
      })

      if (error) {
        report.errors.push({ userId: act.userId, action: "enroll_and_notice", message: error.message })
        continue
      }
    }

    report.enrolled.push(act.userId)
    emailsCount++
  }

  return report
}
